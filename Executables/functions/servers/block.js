const get_block = (args, vm, options) =>{
  let {hash, chain} = args;

  if (hash.__classifier__ !== vm.get_type_address('string')){
    return vm.stderr({name:"Type_error", message:"Hash must be of type string"})
  }
  if (chain.__classifier__ !== vm.get_type_address('chain')){
    return vm.stderr({name:"Type_error", message:"chain must be of instance `Chain`"})
  }
  hash = vm.display(hash, true)

  vm.display(chain, res=>{
    let chain = vm.account.manager.web.get(res.physical_address)
    let blk = chain.explore(JSON.stringify({blocks: hash}))
    blk = blk && blk.stringify()

    vm.air_object(blk, options)
  })
}

export {get_block}