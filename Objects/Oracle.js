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
    this.gds = new GDS(process.env.DATASTORE || "godprotocol").sync({
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
        obj = this.fs.readFileSync(path);
        obj = JSON.parse(obj).data;
        let type = obj && obj.data && typeof obj.data;
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

    this.fs.writeFileSync(address, data, { encoding: "utf-8" });
  };

  fetch = (payload, callback, val_err_cb) => {
    let { physical_address, config, query, account, signature } = payload,
      result;

    account = this.mgr.get_account(account);
    if (account && account.private)
      if (
        !account.validate(
          { physical_address, account, query },
          signature,
          callback
        )
      )
        return typeof val_err_cb === "function" && val_err_cb();

    try {
      let folder = this.gds.folder(this.hash(physical_address));

      if (config) {
        folder.add_remote(config);

        result = folder.config;
      } else {
        if (!folder.check_remote(query.operation)) {
          result = {
            error: true,
            error_message: "Forbidden remote operations",
            payload,
          };
        } else {
          if (query.operation === "call") {
            let compressed_result = this.compression({ payload, val_err_cb });
            if (compressed_result && compressed_result.halt)
              return (
                typeof callback === "function" &&
                callback({ compressed: true, data: compressed_result })
              );
            query = (compressed_result && compressed_result.query) || query;
          }

          let operation = folder[query.operation];

          result =
            operation &&
            operation(query.query, { ...query.options, account, payload });
        }
      }
    } catch (e) {
      result = { error: true, message: e.message, payload };
    }
    typeof callback === "function" && callback(result);
  };
}

export default Oracle;
