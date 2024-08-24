import fs from "fs";
import GDS from "generalised-datastore";
import { hash } from "../utils/hash";

class Oracle {
  constructor(mgr, meta) {
    meta = meta || {};

    this.compression = meta.compression;
    this.fs = fs;
    this.mgr = mgr;
    this.datapaths = new Object();
    this.gds = new GDS(
      meta.datastore || process.env.DATASTORE || "godprotocol"
    ).sync({
      manager: this.mgr,
    });
  }

  get_folder = (physical_address, options) => {
    if (typeof options !== "object") {
      options = { no_new: options ? false : true };
    }
    return this.gds.folder(this.hash(physical_address));
  };

  set = (path, { type, obj }) => {
    this.datapaths[path] = {
      obj,
      type,
    };
  };

  get = (path) => {
    let obj = this.datapaths[path];

    if (!obj) {
      try {
        obj = this.fs.readFileSync(`${this.mgr.root}/${path}`);
        obj = JSON.parse(obj).payload;
        let type = obj && obj.payload && typeof obj.payload;
        type =
          type === "object" ? (Array.isArray(obj) ? "array" : "twain") : type;

        obj = { type, obj };
        this.set(path, obj);
      } catch (e) {}
    }

    return obj;
  };

  hash = (data) => {
    data = typeof data !== "string" ? JSON.stringify(data) : data;
    return hash(data);
  };

  handle_compression = ({ addr, data, no_string }) => {
    if (this.compression) {
      let res = this.compression({ addr, data, no_string });
      if (res) data = res.data;
    }
    if (!no_string && (typeof addr !== "string" || typeof data !== "string"))
      return;

    return data;
  };

  write = (address, payload) => {
    payload = JSON.stringify({ payload });
    let data = this.handle_compression({
      addr: address,
      data: payload,
    });

    this.fs.writeFileSync(`${this.mgr.root}/${address}`, data, {
      encoding: "utf-8",
    });
  };

  fetch = async (payload, callback) => {
    let { physical_address, config, remote, query } = payload,
      result;

    let folder = this.get_folder(physical_address);

    if (config) {
      result = folder.config.stringify();
      folder.add_remote(remote);
    } else {
      if (!folder.check_remote(query.operation)) {
        result = {
          error: true,
          error_message: "Query operation cannot be performed remotely.",
        };
      } else {
        let op = folder[query.operation];

        result = await op(query.query, query.options);
        folder.remote_stuff(remote, result);
      }
    }

    callback(result);
  };
}

export default Oracle;
