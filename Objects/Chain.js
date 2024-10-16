import { _id } from "generalised-datastore/utils/functions";
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
    
    this.txs = new Array();

    this.height = 0;
    this.cursor = -1;
    this.cursors = new Array();
    this.buffs = new Array();

    this.generate_hash();

    this.folder = this.account.manager.oracle.gds.folder(this.hash);
    this.height = this.folder.config.stats.files;
    this.blocks = new Array(this.height);

    if (this.folder.config.stats.chain)
    this.datapath = this.folder.config.stats.chain.datapath

    // console.log(this.folder.config)

    this.account.set_paths(this);

    this.manage_config(true);

    if (this.folder.config.stats.recent_file){
      this.recent_block = this.build_block(this.folder.config.stats.recent_file);
      this.blocks[this.recent_block.index] = this.recent_block
    }
  }

  manage_config = (init) => {
    if (init) {
    }

    this.folder.config.add_entry("chain", this.stringify());
  };

  set_fee = ({purpose, fee, validator})=>{
    this.fees.set({purpose, fee, validator})
  }

  get_fee = purpose =>{
    return this.fees.get(purpose)
  }

  pay = (purpose, payer, cb) =>{
    let account = this.account.manager.get_account(payer)
    let token = this.get_fee(purpose)

    account.process_fee(token, cb)
  }

  set_obj_config = config=>{
    let addr = typeof config === 'string'? config: this.account.save(config)
    
    this.datapath = addr;
    this.manage_config()
  }

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

  build_block = (blk, forge) => {
    if (typeof blk === "string") {
      let blk_data = this.folder.readone(blk, { depth: 1 });

      if (blk_data){
        blk = Block.build(blk_data, this);
      }
    }else if (forge){
      if(!blk.hash) blk.hash = hash(JSON.stringify(blk))
      blk = Block.build(blk, this)
    }
    return blk;
  };

  traverse_blocks = (stop) => {
    let blk =  this.blocks.slice(stop).find(b=>b && b._id);
    
    while (blk&& blk.index !== stop) {
      blk = this.build_block(blk.previous_hash);
      
    }
    return blk;
  };

  get_block = (index) => {
    index = index == null ? this.height -1 : index
    let blk = this.blocks[index];

    if(blk) blk = this.build_block(blk);

    if (!blk||(blk&& blk.index !== index)) {
      console.log("Twisted chain", index,blk&& blk.index, this.physical_address);
      if (index < this.height) {
        blk = this.traverse_blocks(index);
      }
    }
    if(blk&& !isNaN(Number(blk.index)))this.blocks[blk.index] = blk

    return blk;
  };

  add_tx = (instruction) => {
    if (!this.txs.length) this.start_time = Date.now();

    this.txs.push(instruction);
  };

  fabricate_datapath_block=()=>{
    if(!this.datapath)return this.stderr({"name":"Chain_error",'message':'Cannot fabricate datapath block of no-call chain'})

    return this.build_block({metadata:{output:this.datapath}, index:0, _id: _id(this.hash)}, true)
  }

  forge_block = (obj)=>{
    obj.index = this.height
    obj._id = _id(this.hash)
    obj.previous_hash = this.recent_block && this.recent_block._id

    let blk = this.build_block(obj, true)

    this.add_block(blk)

    return blk
  }

  mine = (vm, no_curs) => {

    if (this.physical_address === `${this.account.physical_address}/Datatypes/Void` && this.height){
      let blk = this.get_latest_block()
      vm.connect_block(blk)

      return blk
    }

    let block = new Block(this);

    block.generate_hash();
    block.store(no_curs);

    block.children = this.pending_children;
    this.pending_children = new Array();

    block.timelapse = Date.now() - this.start_time;

    this.add_block(block);

    vm.connect_block(block)

    this.txs = new Array();

    this.manage_config();

    return block;
  };

  persist = block=>{
    let data = block.stringify();

    data = this.account.manager.oracle.handle_compression({
      addr: this.folder.folder_path,
      data,
      no_string: true,
    });

    if(!data.previous_hash &&data.index!==0){
      console.log(data)
      return this.account.vm.stderr({name:"Chain_error", message:"chain corruption, as a non index 0 block is without a previous_hash"})
    }

    this.folder.write(data);
  }

  add_block = (block) => {
    this.blocks.push(block);
    this.height++;

    if (!this.physical_address.startsWith(`${this.account.physical_address}/Opcodes`) &&  Array.from(Object.keys(block.metadata)).length){
      this.persist(block)
    }

    this.recent_block = block;

    if (this.account.initiated){
      let parent_addr = this.parent.physical_address
      if (this.account.vm.stack.has_stack(parent_addr)){
        this.account.vm.stack.push(parent_addr, block);
      }
    }
  };

  get_latest_block = () => {
    let blk = this.recent_block;

    return this.build_block(blk);
  };

  stringify = (str) => {
    let obj = {};

    obj.physical_address = this.physical_address;
    obj.height = this.blocks.length;
    obj.parent = this.parent.path;
    obj.account = this.parent.account.name;
    obj.name = this.name;
    obj.datapath = this.datapath
    obj.connections = this.connections.map((b) =>
      b.stringify
        ? new Object({
            chain: b.chain.hash,
            block: { hash: b.hash, _id: b._id },
          })
        : b
    );
    obj.hash = this.hash;
    // obj.blocks = this.blocks.map((blk) => blk.hash || blk);

    return str ? JSON.stringify(obj) : obj;
  };

  add_chain = (name) => {
    return this.account.add_chain(name, this);
  };
}

export default Chain;
