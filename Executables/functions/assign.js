const assign = (args, vm, options)=>{
  let {location, arguments: argg} = options;
  let {value} = args;

  let value_addr = argg.argv[0].address;
  let value_chain = vm.handle_chain(value_addr);

  let loc_chain = vm.handle_chain(location)
  if(value_chain.datapath){
    loc_chain.set_obj_config(value_chain.datapath)
  }else {
    
    loc_chain.forge_block({metadata:{output: vm.account.save(value)}})
    loc_chain.set_obj_config('')
  }
}


export default assign