const get_address = (args, vm, options) => {
  return vm.air_object(args.object.__address__, options)
}

const get_id = (args, vm, options) => {
  return vm.air_object(args.object.__id__, options)
}

export {get_address, get_id}