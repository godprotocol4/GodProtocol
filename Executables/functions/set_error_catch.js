const set_error_catch = (args, vm)=>{
  // console.log(args)
  let {object, metadata} = args

  let inst = vm.track.sequence[vm.track.pointer +6]
  inst = parseInt(inst.split(' ')[1])
  
  for (let o=0; o< object.length; o++){
    let obj_addr = object[o]
    let obj, statc;
    if (obj_addr === '*'){
      obj = obj_addr
    }else{
      obj = vm.read_chain(obj_addr)
    }

    if (obj !== '*'){
      let name = vm.read_chain(obj.name_id)
    
      statc = vm.static_value(name)
      if(statc.static_value == null){
        return this.stderr(`Invalid argument to an Error object`)
      }
    }
    
    vm.push_int(statc? statc.static_value: obj, {object: obj, metadata, catch_pointer: inst})
  }
  
  vm.track.pointer += 17
  
  vm.pop_context()
}

export default set_error_catch