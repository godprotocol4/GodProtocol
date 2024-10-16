import { generate_random_string } from "generalised-datastore/utils/functions";
import Callables from "./callables";
import Stack from "./stack";
import { post_request } from "godprotocol/utils/services";


class Executables extends Callables{
  constructor(){
    super()

    this.stack = new Stack(this)
  }

  exec = (request)=>{
    let payload = request.op0 || request;

    let {executable, url_callback, location} = payload;
    console.log(request)
    
    if (!executable && request.op1) executable = request.op1.static_value

    if(typeof executable !== 'string' && executable){
      executable = executable.static_value || executable.__address__
    }
    if(!executable)return this.stderr({name: 'Call_error', message:"Executable cannot be undefined"})

    if (!executable.includes('/')){
      let result = this.callable(payload)
      if (url_callback) post_request({options:url_callback, data: result})
      return result
    }

    if(executable.includes('undefined')){
      console.log(executable)
      let err_obj = {name:'Type_error', message: `executable cannot have an undefined config`}
      return this.stderr(err_obj)
    }

    // console.log(payload)
    let config = this.get_config(executable)
    if (!config){
      return this.stderr({name:'Name_error', message:'Callable config not existing'})
    }

    switch(config.type){
      case "class":
        this.execute_class(config, payload)
        break;  
      case "function":
        this.execute_function(config, payload)
        break;
      case "module":
        this.execute_module(config, payload)
        break;
      default:
        this.stderr(`Unknown call type`)  
      ;
    }

    return {
      estimated_time: `-ms`,
      callback: location,
    }
  }

  execute_class = (config, payload)=>{
    let {methods, base_classes} = config;
    let {location, local_address, url_callback, executable} = payload;

    let object = {__classifier__:executable, __type__: `${this.account.physical_address}/CONSTANTS/types/instance`}
    let object_id = generate_random_string(12, 'alnum')
    object.__id__ = object_id

    let real_path = `${local_address || location}_${object_id}`
    let object_chain = this.handle_chain(real_path)

    let location_height = object_chain.height;

    for (let b=0; b< base_classes.length; b++){
      let cls = base_classes[b]
      let cls_config = this.get_config(cls);

      if(!cls_config || (cls_config && cls_config.type !== 'class')){
        return this.stderr(`Base must be a 'class' type`)
      }

      let {methods: b_methods} = cls_config;
      for(let name in b_methods){
        let method_addr = b_methods[name]

       this.handle_method_config({name, method_addr, object, location: real_path, location_height}) 
      }
    }
    for(let name in methods){
      let method_addr = methods[name]

      this.handle_method_config({name, method_addr, object, location: real_path, location_height})
    }
    
    object.__address__ = real_path;

    object_chain.forge_block({metadata:{output: this.account.save(object)}})

    if (object.__init__){
      this.execute_function(this.get_config(object.__init__), {...payload, executable: object.__init__})
    }else {
      if (url_callback) post_request({options:url_callback, data: object})
    }
  }

  execute_function = (config, payload)=>{
    let {arguments: args, location, url_callback, executable, metadata}=payload;
    let {argv, argc} = args ||{};
    argv = argv || []
    let {parameters, object, __address__, method_address} = config;

    let exec_address = method_address || __address__

    this.stack.initiate(exec_address)

    let arg_object = {}
    parameters.map((p, i)=>{
      arg_object[p.name] = {address: p.address, name: p.name, position: p.position || i}
    })

    for (let a =0; a< (argc || argv.length); a++){
      let arg = argv[a]
      let param;
      if (arg.name) {
        param = parameters.find(p=>p.name === arg.name)
      } else {
        param = parameters[arg.position]
        arg.name = param.name
      }

      arg_object[arg.name].address = arg.address
    }

    if(object){
      arg_object.this = {
        position:-1, 
        address: object,
        name:'this'
      }
    }

    for (let a in arg_object) {
      let arg = arg_object[a]
      let param_addr = `${exec_address}/${a}`
      let param_chain = this.handle_chain(param_addr);

      let arg_chain = this.handle_chain(arg.address)

      if(arg_chain.datapath){
        param_chain.set_obj_config(arg_chain.datapath)
      }else {
        let val = this.read_chain(arg_chain)
        param_chain.forge_block({metadata: {output: this.account.save(val)}})
      }
    }

    this.account.run({payload: {physical_address: method_address || __address__}, callback: ({ret})=>{
      this.stack.pop(exec_address)
      this.pop_context()

      let res;
      
      if (typeof location === 'function'){
        res = this.read_chain(ret)
        if(metadata && metadata.loop){
          
          if (!metadata.loop.conditioner(res, metadata) && (metadata.loop.index+1) < metadata.loop.array.length){
            metadata.loop.index ++

            this.exec({executable, location, metadata, arguments: {argv: [{
              address: metadata.loop.array[metadata.loop.index],
              position: 0
            }], argc: 1}})

            return metadata.callback && metadata.callback(res)
          }
        }
        location(res, metadata)
        
      }else if(ret){
        let chain = this.handle_chain(ret)
        let loc_chain = this.handle_chain(location)

        if(chain.datapath){
          res = chain.datapath;
          loc_chain.set_obj_config(res)
        }else {
          res = this.read_chain(chain)
          if (url_callback) post_request({options:url_callback, data: res})

          loc_chain.forge_block({metadata: {output: this.account.save(res)}})
          loc_chain.set_obj_config('')
        }
      }

      if(metadata && metadata.callback){
        metadata.callback(res)
      }
    }})
  }

  handle_method_config = ({name, method_addr, location, object})=>{
    let conf = this.get_config(method_addr);
    
    let obj_method_addr = `${location}/${name}`
    let chain = this.handle_chain(obj_method_addr)

    conf.method_address = conf.__address__
    conf.__address__ = obj_method_addr
    conf.object = location;
    chain.set_obj_config(conf)

    object[name] = obj_method_addr;
  }

  get_config = exe =>{
    let chn = this.handle_chain(exe);

    if (!chn || (chn&& !chn.datapath))return this.stderr(`Executable:${exe} is not callable`)

    return this.account.read(chn.datapath)
  }
}

export default Executables