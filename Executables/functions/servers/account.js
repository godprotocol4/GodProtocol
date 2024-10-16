const connect = (args, vm, options)=>{
  let {name, meta} = args;

  if (name.__classifier__ !== vm.get_type_address('string')){
    return vm.stderr({name:'Type_error', message: 'Account name must be a string'})
  }
  if (meta.__classifier__ !== vm.get_type_address('twain')){
    return vm.stderr({name:'Type_error', message: 'Account name must be a twain'})
  }

  name = vm.display(name)
  meta = vm.display(meta)

  let result = vm.account.manager.add_account(name, {...meta, string:true})

  vm.air_object(result, options)
}

const load = (args, vm, options)=>{
  let {account, payload} = args;

  if (account.__classifier__ !== vm.get_type_address('account')){
    return vm.stderr({name:'Type_error', message: 'account must be an Account instance'})
  }
  if (payload.__classifier__ !== vm.get_type_address('twain')){
    return vm.stderr({name:'Type_error', message: 'Payload must be a twain'})
  }

  account = vm.display(account, )
  payload = vm.display(payload, )

  vm.account.manager.endpoint('load', payload, (response)=>{
    vm.air_object(response, options)
  })
}

const run = (args, vm, options)=>{
  let {account, payload} = args;

  if (account.__classifier__ !== vm.get_type_address('account')){
    return vm.stderr({name:'Type_error', message: 'account must be an Account instance'})
  }
  if (payload.__classifier__ !== vm.get_type_address('twain')){
    return vm.stderr({name:'Type_error', message: 'Payload must be a twain'})
  }

  account = vm.display(account)
  payload = vm.display(payload)

  vm.account.manager.endpoint('run', payload, (response)=>{
    vm.air_object(response, options)
  })
}

const parse = (args, vm, options)=>{
  let {account, payload} = args;

  if (account.__classifier__ !== vm.get_type_address('account')){
    return vm.stderr({name:'Type_error', message: 'account must be an Account instance'})
  }
  if (payload.__classifier__ !== vm.get_type_address('twain')){
    return vm.stderr({name:'Type_error', message: 'Payload must be a twain'})
  }

  account = vm.display(account)
  payload = vm.display(payload)

  vm.account.manager.endpoint('parse', payload, (response)=>{
    vm.air_object(response, options)
  })
}

const servers = (args, vm, options) => {
  let {account} = args;
  account = vm.display(account, (res)=>{
    let acc = vm.account.manager.get_account(res.name);
    vm.air_object(acc.get_servers(), options)
  })
}

export {run, load, servers, parse, connect}