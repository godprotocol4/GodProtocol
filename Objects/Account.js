
import Loader_sequence from "../Loader_sequence/main";
import validate_signature from "../utils/privacy";
import { post_request } from "../utils/services";
import Filesystem from "./Filesystem";
import Virtual_machine from "./Virtual_machine";

class Account extends Filesystem {
  constructor(name, meta = {}) {
    super();

    meta = meta || {};

    this.name = name;
    this.private = meta.private;
    this.manager = meta.manager;
    this.account = this;
    this.stdin = new Array();
    this.stdout = new Array();

    this.log_output = this.manager.logger.store_log

    if (!this.manager) throw new Error("Manager instance missing.");

    this.name_hash();
    this.physical_address = `${this.base_address}/${this.name}`;
    this.set_paths(this);

    this.assembler = new Loader_sequence(this);

    this.chain = this.account_chain(this);
    this.vm = new Virtual_machine(this.chain);

    this.mine_buffer = {};
    this.privileges = new Object();

    this.events = new Object();

    this.log_output(`Account Instance: ${this.name}`);
  }

  on = (event, handler) => {
    let handlers = this.events[event];
    if (!handlers) {
      handlers = new Array();
      this.events[event] = handlers;
    }
    handlers.push(handler);
  };

  emit = (event, data) => {
    let handlers = this.events[event];
    Array.isArray(handlers) &&
      handlers.map((handle) => this.run_callback(handle, data));
  };

  propagate = (data, endpoint) => {
    if (data.is_propagated) return;

    let servers = this.privileges[endpoint];

    if (data.exclusive) {
      if (typeof data.exclusive === "boolean") return;
      else if (Array.isArray(data.exclusive)) {
        servers =
          servers &&
          servers.filter((serv) => {
            return data.exclusive.includes(serv.domain);
          });
      }
    }

    data.is_propagated = true;
    data = JSON.stringify(data);

    if (servers && servers.length) {
      servers.map((serv) => {
        post_request({
          options: {
            ...serv,
            path: `/${endpoint}`,
          },
          data,
        });
      });
    }
  };

  add_server = ({ server, privileges }) => {
    if (!Array.isArray(privileges) && privileges)
      privileges = ["load", "parse", "run", "create_account"];

    privileges.map((privilege) => {
      let priv = this.privileges[privilege];
      if (!priv) {
        priv = [];
        this.privileges[privilege] = priv;
      }
      if (!priv.find((serv) => serv.domain === server.domain))
        priv.push(server);
    });
  };

  get_account = (name) => {
    return this.manager.get_account(name) || this;
  };

  manage_buffer = (callback, real_cb) => {
    let call_session = `${Date.now()}-${Math.random()}`;
    this.mine_buffer[call_session] = { blocks: [], callback, real_cb };

    return call_session;
  };

  results = new Object()

  buff = (block, pid) => {
    if(block.ret){
      this.results[pid] = block.ret
      return;
    }

    let buffer = this.mine_buffer[pid];
    if (!buffer) return;

    block && block.stringify &&  buffer.blocks.push(block.stringify());
  };

  flush_buffer = (pid, payload) => {
    let buff = this.mine_buffer[pid];
    if (!buff) return;

    if (buff.callback){
      this.run_callback(buff.callback,{ payload, ret: this.results[pid] , blocks: buff.blocks});
    } else if(buff.real_cb){
      buff.real_cb(payload)
    }
    
    delete this.mine_buffer[pid];
    delete this.results[pid]
  };

  execute =( opcode, args)=>{
    let circ = this.vm.opcodes[opcode]
    if (typeof circ !== 'function') {return}

    circ(args)
  }

  process_fee = ({fee, validator}, cb)=>{
    let content = this.vm.read_chain(fee, {tell_callable})

    if (content.callable){
      this.vm.exec({executable: content.__address__, location:result=>{
        this.vm.exec({executable: validator, location: result=>{
          cb && cb(result)
        }, arguments: {argc:1, argv: [{position: 0, static_value: result}]}})
      } })
    }else {
      this.vm.exec({executable: validator, location: (result)=>{
        cb && cb(result)
      }, arguments: {argc:1, argv: [{position:0, address: fee}]}})
    }
  }
  
  load = (payload) => {
    let { program, callback, location } = payload;
    let { instructions, assemble, forge, spawn, unshift } = program;

    this.propagate(payload, "load");
    
    if(forge){
      let chain = this.vm.handle_chain(forge)
      chain.forge_block({metadata:{output:this.save(instructions)}})
    } else if (assemble) {
      this.assembler
        .spawn()
        .run(instructions, { cb: callback, location, options: assemble , unshift});
    } else {
      let pid = this.manage_buffer(location?res=>{
        this.vm.air_object(res, {location})
      } : callback,location&& callback);

      this.manager.push({ sequence: instructions, spawn, account: this, pid, unshift });
    }

    if(location && callback){
      callback({estimated_time:'-ms', callback:location})
    }
  };

  parse = (program) => {
    let { payload, callback, signature } = program;

    this.propagate(program, "parse");

    this.manager.oracle.fetch({ ...payload, signature }, (result) =>
      this.run_callback(callback, result)
    );
  };

  run = (request) => {
    let { payload, callback, location} = request;

    let { physical_address, query, history } = payload;

    history = Math.abs(Number(history)) || 0;

    this.propagate(request, "run");

    let pid = this.manage_buffer(location?res=>{
      this.vm.air_object(res, {location})
    } : callback,location&& callback);

    let context = physical_address
      ? this.manager.web.get(physical_address)
      : this.vm.get_context();

    if (!context) {
      if (physical_address)
        context = this.vm.handle_chain(physical_address);
      else return this.flush_buffer(pid);
    }
    if(!context)throw new Error()

    let blk = query ? context.explore(query) : context.get_latest_block();

    // console.log(context.stringify())
    // console.log(blk)

    if (!query) {
      let index = context.height;
      index -= 1;

      const historic = (blk) => {
        if (blk && blk.metadata.program) {
          if (history) {
            history--;
            blk = null;
          }
        } else blk = null;
        
        return blk;
      };
      blk = historic(blk);

      while (!blk && index >= 0) {
        index--;
        blk = context.get_block(index);

        blk = historic(blk);
        // console.log(blk)
      }
    }

    // console.log(blk)

    if (blk && blk.metadata && blk.metadata.program) {
      let program = this.read(blk.metadata.program);

      if (Array.isArray(program) && program.length) {
        this.vm.push_context(context);
        program = [...program, 'pop']

        // console.log(program)

        this.manager.push({
          sequence: program,
          account: this,
          payload,
          error_stack: JSON.stringify(this.vm.error_manager),
          pid,
        });
      }
    } else this.flush_buffer(pid,{error:true, error_message: "Program is not set!"});

    if(location && callback){
      callback({estimated_time:'-ms', callback:location})
    }
  };

  run_callback = (callback, payload) => {
    setTimeout(() => {
      if (!callback) return;

      if (typeof callback === "function") return callback(payload);

      callback.payload &&
        callback.payload.physical_address &&
        this.vm.stdin(payload, callback);
    }, 0);
  };

  flush_stdout = (block) => {
    if (
      block.chain.physical_address === `${this.physical_address}/Opcodes/stdout`
    )
      return;

    for (let s = 0; s < this.stdout.length; s++) {
      let out = this.stdout[s];
      if (out.pid === this.vm.track.pid) {
        block.metadata.stdout.push(out.data);
        this.stdout[s] = null;
      }
    }
    this.stdout = this.stdout.filter((out) => !!out);
  };

  validate = (payload, signature, callback) => {
    if (!this.private) return true;

    let valid = validate_signature(
      this.name,
      JSON.stringify(payload),
      signature
    );
    if (!valid && callback)
      this.run_callback(callback, {
        private: this.private,
        error: true,
        error_message: "Invalid signature",
      });

    return valid;
  };

  stringify = (str) => {
    let obj = {};

    obj.name = this.name;
    obj.hash = this.hash;
    obj.path = this.path;
    obj.private = this.private;
    obj.chain = this.chain.stringify();
    obj.physical_address = this.physical_address;

    return str ? JSON.stringify(obj) : obj;
  };

  create_account = (payload) => {
    this.propagate(payload, "create_account");
    let { name, meta } = payload;

    return this.manager.add_account(name, meta);
  };
}

export default Account;
