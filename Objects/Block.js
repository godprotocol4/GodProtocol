import { hash } from "../utils/hash";
import { _id } from "generalised-datastore/utils/functions";

class Block {
  constructor(chain) {
    this.chain = chain;
    this.data = this.chain.txs;
    this.metadata = {};
    this.children = new Array();
    this.index = this.chain.height;
    this._id = _id(this.chain.hash);
    this.previous_hash = this.chain.recent_block && this.chain.recent_block._id;
  }

  generate_hash = () => {
    this.hash = hash(JSON.stringify(this.data));
  };

  store = (no_curs) => {
    let content = this.chain.buffs.splice(-1)[0];
    if (!no_curs) this.cursor = this.chain.cursors.splice(-1)[0];
    if (!content) return;

    let cursors = Object.keys(content).filter(
      (c) => c.startsWith("{") && c.endsWith("}")
    );

    for (let c = 0; c < cursors.length; c++) {
      let curs = cursors[c];

      this.metadata[curs.slice(1, -1)] = content[curs];
      delete content[curs];
    }
    this.metadata.stdout = new Array();
    this.chain.account.flush_stdout(this);

    let datapath = this.chain.account.save(content, this.chain);
    this.datapath = datapath;
  };

  stringify = (str) => {
    let obj = {};

    obj.metadata = this.metadata;
    obj.datapath = this.datapath;
    obj.timelapse = this.timelapse;
    obj.index = this.index;
    obj.hash = this.hash;
    obj.previous_hash = this.previous_hash;
    obj.data = this.data;
    obj._id = this._id;
    obj.children = this.children.map((ch) => ch._id);
    obj.chain = {
      hash: this.chain.hash,
      physical_address: this.chain.physical_address,
    };

    return str ? JSON.stringify(obj) : obj;
  };

  static build = (data, chain) => {
    let blck = new Block(chain);
    blck.chain = chain;
    blck.metadata = data.metadata;
    blck.datapath = data.datapath;
    blck.timelapse = data.timelapse;
    blck.index = data.index;
    blck.previous_hash = data.previous_hash;
    blck.hash = data.hash;
    blck.data = data.data;
    blck.children = data.children || [];

    blck._id = data._id;

    return blck;
  };
}

export default Block;
