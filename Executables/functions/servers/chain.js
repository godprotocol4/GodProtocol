const get_chain = (args, vm, options) =>{
  let {physical_address, account} = args;

  if (account.__classifier__ !== vm.get_type_address('account')){
    return vm.stderr({name:'Type_error', message: 'account must be an Account instance'})
  }
  if (physical_address.__classifier__ !== vm.get_type_address('string')){
    return vm.stderr({name:'Type_error', message: 'physical_address must be a string'})
  }

  physical_address = vm.display(physical_address)

  vm.display(account, res=>{
    let acc = vm.account.manager.get_account(res.name)

    let addr = acc.resolve_address(physical_address)
    let chain = vm.account.manager.web.get(addr)

    vm.air_object(chain && chain.stringify(), options)
  })
}

const explore = (args, vm, options)=>{
  let {chain, query} = args;

  if (![vm.get_type_address('string'), vm.get_type_address('twain')].includes(query.__classifier__)){
    return vm.stderr({name:"Type_error", message: "query must be of type string | twain"}) 
  }
  query = vm.display(query, true)
  if(typeof query !== 'string')query = JSON.stringify(query)

  vm.display(chain, res=>{
    let chn = vm.account.manager.web.get(res.physical_address)
    if (!chn)return vm.stderr({name: 'Chain_error', message: `${res.physical_address} not set.`})

    let blk = chn.explore(query)

    vm.air_object(blk && blk.stringify(), options)
  })
}

export {get_chain, explore}