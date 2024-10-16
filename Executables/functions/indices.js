

const get = (args, vm, options)=>{
  let{obj,prop}=args;

  // console.log(args, 'get args')
  if(!obj||!prop) return vm.stderr(`Invalid arguments in get.callable`)

  if (obj.__classifier__ === vm.get_type_address('twain')){
    let get_ = require('./methods/twain').get
    return get_({twain: obj, prop}, vm, options)
  }
  prop = vm.static_value(prop)

  if (prop.__print__){
    vm.exec({executable: prop.__print__, location: (prop)=>{
      
      if(!prop.static_value)return this.stderr({name:'Type_error', message: "get.callables"})
 
      let addr = obj[prop.static_value]
      let result = vm.read_chain(addr)

      vm.write_chain(result, options.location)
      
    }})
  
    return;
  }
  
  let static_prop = prop.static_value
  let addr = obj[static_prop]
  let result = vm.read_chain(addr)

  return {result, is_callable: !!(result.__address__ && vm.handle_chain(result.__address__).datapath)}
}

const set = (args, vm)=>{
  let {obj, prop, value} = args;

  // console.log(args, 'set args')
  if(!obj || !prop || !value) return vm.stderr(`Invalid arguments in set.callable`)
  
  prop = vm.static_value(prop)
  
  let static_prop = prop.static_value
  let val_addr = value.__address__
  obj[static_prop] = val_addr;

  vm.write_chain(obj, obj.__address__, {is_callable: !!vm.handle_chain(value.__address__).datapath})

  return {
    result: obj,
  }
}

export {get, set}