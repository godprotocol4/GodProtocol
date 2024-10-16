const price = (args, vm, options)=>{
  let {commodity, purpose, validator, fee} = args;

  let addr = commodity.__address__
  let chain = vm.handle_chain(addr)
  chain.set_fee({purpose, validator, fee})

  return {result: commodity}
}

const pay = (args, vm, options) =>{
  let {payer, purpose, fee, payee, callback} = args;

  let chain = vm.handle_chain(payee.__address__)
  let pass = chain.pay(purpose, fee, payer, (pass)=>{
    pass = vm.display(pass)
    if(pass.static_value !== true) return vm.air_object(null, options)

    vm.exec({executable: callback, location: options.location, arguments: {argc:1, argv:[{position:0, static_value: pass.payload}]}})
  })

  return {result: pass}
}


export {price, pay}