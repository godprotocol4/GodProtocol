const readone = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.readone(res), options)
  })
}

const read = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.read(res), options)
  })
}

const clean_check_folder = (args, vm)=>{
  let {folder}= args;

  let name = vm.read_chain(folder.name)
  if(name.__classifier__ !== vm.get_type_address('string')){
    return vm.stderr({name:'Type_error', message: "Folder name must be a string."})
  }else name = vm.static_value(name);

  let fold = vm.account.manager.oracle.gds.folder(name.static_value)

  return {name, fold}
}

const write = (args, vm, options) =>{
  let {data} = args;

  let {fold} = clean_check_folder(args, vm)
  
  vm.display(data, (res)=>{
    vm.air_object(fold.write(res), options)
  })
}

const write_several = (args, vm, options) =>{
  let {data} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(data, (res)=>{
    vm.air_object(fold.write_several(res), options)
  })
}


const remove = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.remove(res), options)
  })
}

const remove_several = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.remove_several(res), options)
  })
}

const update = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.update(res), options)
  })
}

const update_several = (args, vm, options) =>{
  let {query} = args;

  let {fold} = clean_check_folder(args, vm)

  vm.display(query, (res)=>{
    vm.air_object(fold.update_several(res), options)
  })
}

export {read, readone, update, update_several, write, write_several, remove, remove_several}