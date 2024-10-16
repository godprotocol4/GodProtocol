class Callables{
  constructor(){
    this.callables = new Object()
  }

  prepare_callable_args = (config, payload)=>{

    let {arguments:args} = payload;
    let {argv} = args;

    let arg_obj = {}, spreading;

    for (let a=0;a< argv.length;a++){
      let arg = argv[a]

      let param, content = arg.static_value || this.read_chain(arg.address)
      if(spreading){
        arg_obj[spreading].push(content)
      } else {
        if (arg.name){
          arg_obj[arg.name] = content;
          param = config.parameters.find(p=>p.name === arg.name)
        }else {
          param = config.parameters[arg.position]
          if(!param)continue
          arg_obj[param.name] = content
        }

        if (param.spread){
          spreading = param.name;
          arg_obj[spreading] = [arg_obj[spreading]]
        }
      }
    }

    return arg_obj
  }

  callable = (payload)=>{
    let {executable, metadata, location} = payload;
    if (!metadata)metadata = {}

    let call = this.callables[executable];
    if(!call)return this.stderr(`Callable:${executable} is not set`)

    let callable = call.callable;
    let config = call.config

    if (typeof callable !== 'function') return this.stderr(`Callable:${executable} must be a callable type.`)


    let args;
    if (config) {
      args = this.prepare_callable_args(config, payload)
    }

    let result = callable(args, this, {...payload, location})
    if (!metadata.raw )
    result && this.write_chain(result.result,result.address|| location, {is_callable: result.is_callable})

    return metadata.raw ? result : {
      estimated_time: '-ms',
      callback: location
    }
  }

  write_chain = (result, location, options)=>{
    if (result==null)return
    let {is_callable}=options || {};

    let loc_chain = this.handle_chain(location)
  
    if(is_callable){
      loc_chain.set_obj_config(result)
    }else {
      loc_chain.forge_block({metadata: {output: this.account.save(result)}})
    }
  }

  add_callable = (name, callable_config)=>{
    this.callables[name] = callable_config
  }

  composite_depth = 3

  display = (values, options )=>{
    let {buff, depth, include_address} = options || {}, value;
    if (!buff) buff =  new Object()
   
    if (!values)return values
    
    if (values.__print__ ){
       let stat = this.static_value(values, true)
      if(!stat)return values;
      value = stat
    }else value = values

    let hash = this.account.manager.oracle.hash(value);
    if (buff[hash]) return buff[hash]

    if(value.type === 'array'){
      let arr = []
      for (let a=0; a< value.static_value.length; a++){
        arr.push(this.display(this.read_chain(value.static_value[a]), {buff}))
      }
      value = arr;
    }else if (value.type === 'twain'){
      let keys = Object.keys(value.static_value)
      let obj = {}
      for (let s=0; s< keys.length; s++){
        let key = keys[s]
        let pair = value.static_value[key]
        
        let prop = this.display(this.read_chain(pair[0]), {buff})

        obj[prop] = this.display(this.read_chain(pair[1]), {buff})
      }
      value = obj
    }else if (['string', 'number', 'boolean'].includes(value.type)){
      value = value.static_value
    }else value = (value && value.__address__) || value

    buff[hash] = value;
    
    if (depth == null){
      return value;
    }
  }
}

export default Callables