const typecast =(args, vm, options)=>{

  // console.log(args, 'typecast args')
  let {type, obj}= args;
  type = vm.static_value(type)
  let static_type = type.static_value;
  let result;

  if (obj.hasOwnProperty('static_value')){
    if(static_type === 'boolean'){
      result= (!!obj.static_value)
      
      return {result: vm.static_cast(result, obj.__address__)};
    } else if(static_type === 'string'){
      result = obj.static_value.toString()
      
      return {result: vm.static_cast(result, obj.__address__)}
    } else if (static_type === 'number'){
      result = parseInt(obj.static_value)
      if (isNaN(result)){
        result = null
      }
      return {result: vm.static_cast(result, obj.__address__)};
    }else if (static_type === 'array'){
      if (obj.type === 'array'){
        return {result: obj}
      }
    }else if (static_type === 'twain'){
      if (obj.type === 'twain'){
        return {result: obj}
      }
    }
  } else if(obj.__print__) {
    console.log(obj)
    vm.exec({executable:obj.__print__, location:result=>{
      let res = typecast({...args, obj: result}, vm)
      res && vm.write_chain(res.result, options.location)
    }})
  }
}


export default typecast