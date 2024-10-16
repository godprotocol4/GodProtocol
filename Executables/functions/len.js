const len = (args, vm, options) => {
  let {object} = args;

  if(![vm.get_type_address('string'),vm.get_type_address('array')].includes(object.__classifier__)){
    if (object.__len__){
      vm.exec({executable: object.__len__, location: result=>{
        if (result.__classifier__ !== vm.get_type_address('number')){
          return vm.stderr({name:'Type_error', message: `__len__ method should only return type of 'number'`})
        }
        
        vm.write_chain(result, options.location)
      }})
    }else return vm.air_object(null, options)
  }

  let statics = vm.static_value(object)

  vm.air_object(statics.static_value.length, options)
}


export default len