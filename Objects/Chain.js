import { hash } from "../utils/hash";
import Block from "./Block";
import Explorer from "./Explorer";

class Chain extends Explorer {
  constructor(parent, name) {
    super();

    this.parent = parent;
    this.account = this.parent.account;
    this.name = name || this.parent.name;
    this.physical_address =
      this.parent.manager || !name
        ? this.parent.physical_address
        : `${this.parent.physical_address}/${this.name}`;

    this.pending_children = new Array();
    this.connections = new Array();

    this.blocks = new Array();
    this.txs = new Array();

    this.height = 0;
    this.cursor = -1;
    this.cursors = new Array();
    this.buffs = new Array();

    this.generate_hash();

    this.folder = this.account.manager.oracle.gds.folder(this.hash);
    this.height = this.folder.config.stats.files;

    this.account.set_paths(this);

    this.manage_config(true);

    this.recent_block = this.build_block(this.folder.config.stats.recent_file);
  }

  manage_config = (init) => {
    if (init) {
    }

    this.folder.config.add_entry("object", this.stringify());
  };

  append_buffer = () => {
    this.buffs.push({});
    this.cursors.push(this.cursor);
    this.cursor = -1;
  };

  set_cursor = (cursor) => {
    this.cursor = cursor;
    this.cursors.push(cursor);
  };

  get_buffer = () => {
    this.cursor = this.cursors.pop();
    return this.buffs.slice(-1)[0];
  };

  generate_hash = () => {
    this.hash = hash(this.physical_address);
  };

  build_block = (blk) => {
    if (typeof blk === "string") {
      let blk_data = this.folder.readone(blk, { depth: 1 });

      if (blk_data) blk = Block.build(blk_data, this);
    }
    return blk;
  };

  traverse_blocks = (stop) => {
    let blk = this.recent_block;
    while (blk.index !== stop) {
      blk = this.build_block(blk.previous_hash);
    }
    return blk;
  };

  get_block = (index) => {
    let blk = this.build_block(this.blocks[index]);

    if (!blk || (blk && blk.index !== index)) {
      console.log(
        "Twisted chain",
        index,
        blk && blk.index,
        this.physical_address
      );
      if (index < this.height) {
        blk = this.traverse_blocks(index);
      }
    }

    return blk;
  };

  add_tx = (instruction) => {
    if (!this.txs.length) this.start_time = Date.now();

    this.txs.push(instruction);
  };

  mine = (vm, no_curs) => {
    let block = new Block(this);

    block.generate_hash();
    this.add_block(block);

    block.store(no_curs);

    block.children = this.pending_children;
    this.pending_children = new Array();

    let prev_context = vm.get_context(-2);
    if (prev_context) {
      prev_context.pending_children.push(block);
      prev_context.connections.push(block);
    }

    this.txs = new Array();

    block.timelapse = Date.now() - this.start_time;

    this.manage_config();

    let data = block.stringify();

    data = this.account.manager.oracle.handle_compression({
      addr: this.folder.folder_path,
      data,
      no_string: true,
    });

    this.folder.write(data);

    return block;
  };

  add_block = (block) => {
    let recent_blk = this.get_latest_block();
    block.previous_hash = recent_blk && recent_blk._id;
    this.blocks.push(block);
    this.height = this.blocks.length;

    this.recent_block = block;
  };

  get_latest_block = () => {
    let blk = this.recent_block;

    return blk;
  };

  stringify = (str) => {
    let obj = {};

    obj.physical_address = this.physical_address;
    obj.height = this.blocks.length;
    obj.parent = this.parent.path;
    obj.account = this.parent.account.name;
    obj.name = this.name;
    obj.connections = this.connections.map((b) =>
      b.stringify
        ? new Object({
            chain: b.chain.hash,
            block: { hash: b.hash, _id: b._id },
          })
        : b
    );
    obj.hash = this.hash;
    obj.blocks = this.blocks.map((blk) => blk.hash || blk);

    return str ? JSON.stringify(obj) : obj;
  };

  add_chain = (name) => {
    return this.account.add_chain(name, this);
  };
}

export default Chain;
