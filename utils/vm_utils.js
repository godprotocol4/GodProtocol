import { generate_random_string } from "generalised-datastore/utils/functions";
import Executables from "../Executables/executables";

class Vm_utils extends Executables{
  constructor(){
    super()

    setTimeout(() => {
      this.  air_object_paths = new Array(
      `${this.account.physical_address}/language/natives/datatypes/string/String`,
      `${this.account.physical_address}/language/natives/datatypes/number/Number`,
      `${this.account.physical_address}/language/natives/datatypes/twain/Twain`,
      `${this.account.physical_address}/language/natives/datatypes/array/Array`,
      `${this.account.physical_address}/language/natives/datatypes/boolean/Boolean`,
      `${this.account.physical_address}/language/natives/datatypes/void/Void`,
      `${this.account.physical_address}/language/natives/server/chain/Chain`,
      `${this.account.physical_address}/language/natives/server/block/Block`,
      `${this.account.physical_address}/language/natives/server/chain/Chain`,
    )
    }, 0);

    this.error_instance_address = "Accounts/initiator/language/natives/errors"
  
   this.air_types = new Array('boolean', 'string', 'twain', 'array', 'number', 'void')
  }

  set_config = (config)=>{
    config = config.op0;
    let chain = this.handle_chain(config.__address__);
    chain.set_obj_config(config)
  }

  get_context = (index) => {
    return this.contexts.slice(index == null ? -1 : index)[0];
  };

  parse_arg = (arg, opcode) => {
    let context = this.get_context();

    let args = arg.split("/"),
      i = 0;

    while (args[0] === "..") {
      i++;

      args.splice(0, 1);
    }

    i = (i + 1) * -1;
    context = i ? this.get_context(i) : context;

    arg = args.join("/");

    while (arg.includes("^")) {
      let blk = context.connections.slice(-1)[0];
      if (!blk) break;
      context = blk.chain;
      let i = arg.indexOf("^");
      arg = `${arg.slice(0, i)}${arg.slice(i + 1)}`;
    }

    let is_cursor = opcode === 'cursor'
    if (arg.startsWith("{*") && is_cursor) {
      arg = context.explore(arg.slice(2, -1));
    } else if (arg.startsWith("{") && !is_cursor) {
      arg = context.explore(arg.slice(1, -1));
      if (['chain', 'link'].includes(opcode) && arg.includes('/')){
        arg = this.account.read(arg)
      }
    }

    return arg;
  };

  split_instruction = (instruction) => {
    let split = instruction.split(" ");
    let opcode = split[0],
      args = split.slice(1).join(" ");

    return { opcode, args };
  };

  handle_chain = (args, context)=>{
    if (!args) return
    if(!context) context = this.account.chain

    let web = context.account.manager.web, chain;
    
    if (args.includes('/')){
      chain = web.get(args)||web.split_set(args);
    } else chain = context.account.add_chain(args, context);

    return chain
  }

  read_chain = (addr, options)=>{
    options = options || {}
    let {no_callable, tell_callable, index} = options, callable;

    if(!addr) return this.stderr(`Physical address cannot be undefined`)
    let chn = addr.physical_address? addr: this.handle_chain(addr)

    if (!chn)return this.stderr(`Address chain:${addr.physical_address ||addr} not found`)

    let output;
    if (chn.datapath && !no_callable){
      output = chn.datapath
      callable = true;
    }else {
      callable = false
      if (!chn.height) return no_callable?null: this.stderr(`Chain has no height - ${addr.physical_address || addr}`)

      let recent = chn.get_block(index)
    
      output = recent.metadata.output;
      
      if (!output)return;
    }
    output = this.account.read(output)

    return  tell_callable? {output, callable} :output;
  }

  connect_block = block=>{
    if(!block){
      console.log(`Checkengine`)
      return;
    }
    let prev_context = this.get_context(-2);
    if (prev_context) {
      if(block.chain.datapath){
        block.metadata.output = block.datapath
      }
      prev_context.pending_children.push(block);
      prev_context.connections.push(block);
    }
  }

  get_type_address =type=>{
    return this.air_object_paths.find(p=>p.includes(type))
  }

  parse_composite_content = (content, options)=>{
    let {item_type, location} = options;

    if (item_type === 'static_object'){
      for (let c = 0; c< content.length; c++){
        let cont = content[c]
        let cont_addr = `${location}_${c}`
        this.write_chain(cont, cont_addr)
        content[c] = cont_addr;
      }
    }

    return content;
  }

  air_object = (content, options)=>{
    let {location, callback, local_address, metadata} = options;

    if (Array.isArray(content)){
      content=  this.parse_composite_content(content, options)
    }

    let static_location = `${local_address || location}_${generate_random_string(8, 'alnum')}`

    let statc = this.static_cast(content, static_location)
    let type = typeof statc === 'string' ? 'void' : statc.type

    this.stdin(statc,()=>  this.exec({
      executable: this.get_type_address(type), 
      location,
      metadata:{callback, ...metadata},
      arguments: {
        argc:1,
        argv:[{position: 0, address: static_location, name:'value'}]
      }}),
      {address: static_location}
    )
  }
  
  id_hash = (data)=>{
    let res = this.account.manager.oracle.hash(data, 'sha-1')
    if (!isNaN(Number(res[0]))){
      res = `_${res}`
    }

    return res;
  }

  get_voided_block = ()=>{
    if(!this.account.initiated)return

    let Void = this.account.get_datatype_chain(`Void`)
    this.flags.void = true;
    return Void && Void.get_latest_block()
  }

  modify_twain = (twa, chain, config)=>{

    if (twa.__index__){
      if (typeof twa.__index__ === 'number') twa.__index__ = chain.height
      else twa.__index__[config.name] = chain.height
    }
    return twa
  }

  slice_trace = (s)=>{
    let s_length = this.stacktrace.length;
      for(let i=0; i < s_length - s; i++ ) this.pop_context()
  }

  push_context = context => {
    this.contexts.push(context)
    this.stacktrace.push(context.physical_address)
    // console.log(`>> Current Stack - ${context.physical_address}`)
  }

  pop_context = () => {
    let context = this.contexts.pop()
    let addr = this.stacktrace.pop()

    // console.log(`> Current Stack - ${this.contexts.slice(-1)[0].physical_address}`)

    if(context && context.physical_address !== addr)
      this.stderr(`Stack missalignment - ${context.physical_address} : ${addr}`)
  }


  run_opcode = (arg_arr, opcode)=>{
    let circ = this.opcodes[opcode]

    if (!circ)return this.stderr(`Opcode:${opcode} not set`)

    let arg = {}
    arg_arr.map((a,i)=>{
      arg[`op${i.toString()}`] = a
    })

    return circ(arg, this)
  }

  static_cast = (content, addr)=>{
    let res_obj = {}
    let type = typeof content;
    if(type === 'object' || type === 'undefined'){
      if(content == null){
        res_obj = "{'type':'void','static_value':Void,'__address__':'Accounts/initiator/Datatypes/Void'}"
      }else if (Array.isArray(content)){
        res_obj = {type:'array', static_value: content}
      }else res_obj = {type:'twain', static_value: content}
    }else {
      res_obj = {type, static_value: content}
    }

    if (addr && typeof res_obj !== 'string') {
      res_obj.__address__ = addr
    }
    
    return res_obj
  }

  is_readonly = (args)=>{
    if (args.op1.startsWith('__') && args.op1.endsWith('__') && args.op1 !== '__'){
      let val = args.op0[args.op1]
      let chn = this.handle_chain(`${val}/.config`)
      let recent = chn.get_latest_block()
      let value;
      if(recent){
        value = recent.metadata.output;
        value = this.account.read(value)
        if (value && !['function', 'class'].includes(value.type)){
          return this.stderr('Cannot delete `readonly` property')
        }
      }
    }
  }
  
  static_value = (value, blow)=>{
    if (value && value.__print__){
      if(this.air_object_paths.includes(value.__classifier__)){
        value = this.read_chain(value.value)
      }else if (blow){
        return
      }
    }
    
    return value
  }
}

export default Vm_utils