import Opcodes from "./Opcodes";

class Virtual_machine extends Opcodes {
  constructor(context) {
    super();

    this.account = context.account;
    this.contexts = [context];
    this.flags = {
      neg: false,
      equal: false,
      zero: false,
      void: false,
    };

    this.stacktrace = new Array()

    this.error_manager = new Object()
  }
  
  push_int = (name, payload)=>{
    let stacks = this.error_manager[name]
    if (!stacks){
      stacks = new Array()
      this.error_manager[name] = stacks;
    }

    stacks.push(payload)
  }

  quit = (payload)=>{
    let instruction = this.track.sequence[this.track.pointer-1]
    if(instruction==='ret'){
      this.account.buff({ret:payload.op0}, this.track.pid)
    }

    this.account.flush_buffer(this.track.pid, payload);
    this.track.pointer = this.track.sequence.length;
    this.pop_context()
  }

  stderr = (err_object)=>{
    console.log(err_object)
    let{name, message} = err_object;

    if (!name){
      return this.quit(err_object)
    }

    let all = this.error_manager['*']
    let stacks = this.error_manager[name]

    if (!stacks){
      if(all){
        all = all.slice(-1)[0]
        let object = this.read_chain(`${this.error_instance_address}/${name}_`)
        stacks = [{object, metadata: all.metadata, catch_pointer: all.catch_pointer}]

        if(!object)return this.quit({message: `Unknown Error instance - ${name}`})
      }
      
      if (!stacks)
      return this.quit(err_object)
    }else if(all){
      // Check precedence within all and stacks name, how?
    }

    let obj_payload, s;
    for(s = this.stacktrace.length - 1; s >= 0; s--){
      let trace = this.stacktrace[s]
      let should_break;

      for (let t = stacks.length-1; t >= 0; t--){
        obj_payload = stacks[t]
        if(obj_payload.metadata.namespace === trace){
          should_break = true
          break;
        }
      }
      if (should_break) break;
    }


    if (!obj_payload){
      return this.quit(err_object)
    }

    if(obj_payload.metadata.alias){
      // Instantiate error message as an aircode string object.
      let message_string = `${obj_payload.metadata.namespace}/${this.id_hash(
        message
      )}`;
      this.air_object(message, {
        location: message_string,
        callback: () => {
          this.exec({
            executable: obj_payload.object.set_message,
            location: obj_payload.metadata.alias,
            metadata: {
              callback: () => {
                this.slice_trace(s+1)

                this.track = this.account.manager.set_track({account: this.account.name, physical_address: obj_payload.metadata.namespace, pointer: obj_payload.catch_pointer}, true)
              },
            },
            arguments: {
              argv: [
                {
                  address: message_string,
                  position: 0,
                },
              ],
              argc: 1,
            },
          });
        },
      });
     
    }else {
      this.slice_trace(s-3)
      
      this.track = this.account.manager.set_track({account: this.account.name, physical_address: obj_payload.metadata.namespace, pointer: obj_payload.catch_pointer}, true)

    }
  }

  execute = (instruction, track) => {
    this.track = track;

    if (!instruction) return;

    let { opcode, args } = this.split_instruction(instruction);

    let context = this.get_context(-1);

    if (!context) return;

    context.add_tx(instruction);

    // console.log(`(${track.pointer}/${track.sequence.length})>> ${instruction}`)
    // this.account.log_output(`>> ${instruction}`);

    let chain;

    args = this.parse_arg(args, opcode);

    switch (opcode) {
      case "chain":
        chain = this.handle_chain(args, context)

        if(!chain)return this.stderr(`Chain error - ${args}`)
       
        this.push_context(chain);

        let dim = context.folder.config.dimensions;
        if (!dim) {
          dim = [];
          context.folder.config.dimensions = dim;
        }
        !dim.find((d) => d === args) && dim.push(args);

        chain.append_buffer();

        break;
      case "link":
        chain = this.handle_chain(args, context)

        if (!chain) {
         return this.stderr(`LINKing Failed. - ${args}`)
        }

        chain.append_buffer();

        this.push_context(chain);

        break;
      case "pop":
        let blk;
        if (context.txs.length > 1) {
          blk = context.mine(this);
        } else {
          if (this.account.initiated&& this.account.is_datatype(context)){
            blk= context.mine(this)
          }else {
            blk = context.get_latest_block();
            if(!blk || context.datapath){
              if(context.datapath){
                blk = context.fabricate_datapath_block()
              }else blk = this.get_voided_block()
            }
            
            if (blk){
              if (blk.chain.physical_address!== `${this.account.physical_address}/Datatypes/Void`) this.flags.void = false

              this.get_context(-2).connections.push(blk);
            }

            context.get_buffer()
            context.txs = [];
          }
         
        }

        blk && this.account.buff(blk, this.track.pid);

        this.pop_context();
        break;
      case "cursor":
        context.set_cursor(args);
        break;
      case "write":
        context.account.write(args, context);
        break;
      default:
        this.prepare_operation(opcode, context);
        break;
    }
  };
}

export default Virtual_machine;
