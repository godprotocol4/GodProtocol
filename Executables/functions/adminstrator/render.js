const render = (args, vm, options) => {
  let {object, page} = args;

  if (!object.render){
    return vm.stderr({name:'Name_error', message:"A render method is neccessary for Adm display"})
  }

  let config = vm.read_chain(object.config)
  config = vm.display(config);

  console.log(config)
  
  vm.exec({executable: object.render, location: result=>{
    let raw = vm.display(result, {include_address:true})

    raw.address = object.__address__
    raw.page = page;
    
    vm.air_object(raw, options)
  }})
  
}

export {render}