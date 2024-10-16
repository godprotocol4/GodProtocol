import typecast from "../typecast";

const slice = (args, vm, options)=>{
  let {str, start, end} = args;

  if(start.__classifier__ !== vm.get_type_address('number')){
    return {result:str}
  }else start = vm.static_value(start)

  if(!end || (end && end.__classifier__ !== vm.get_type_address('number'))){
    end = {static_value: undefined}
  }else end = vm.static_value(end)

  vm.exec({executable:str.__print__, location:(result)=>{
    let new_val = result.static_value.slice(start.static_value, end.static_value)

    vm.air_object(new_val, options)
  }})  
}

const case_ = (args, vm, options)=>{
  let {str, type} = args;

  if(str.__classifier__ !== vm.get_type_address('string')){
    return {result:null}
  }
  if (type.__classifier__ !== vm.get_type_address('number')){
    return {result: str}
  }else type = vm.static_value(type)

  vm.exec({executable: str.__print__, location:(result)=>{
   let new_val = result.static_value;

   switch(type.static_value){
    case 1:
      new_val = new_val.toUpperCase()
      break;
    case 2:
      new_val = new_val.toLowerCase()
      break;
    case 3:
      let nv = new_val.split(' ')
      new_val = ''
      nv.map(n=>{
        new_val = `${new_val} ${n[0].toUpperCase()}${n.slice(1).toLowerCase()}`
      })
      new_val = new_val.trim()
      break;
    default:;
   }
   
   vm.air_object(new_val, options)
  }})

}

const concat_ = (str, other, index)=> {
  if (index === undefined || index > str.length) {
      index = str.length;
  }
  
  let start = str.slice(0, index);
  let end = str.slice(index);
  
  str = `${start}${other}${end}`;
  return str;
}

const concat = (args, vm, options)=>{
  let {str, other, index} = args;

  if (other.__classifier__ !== vm.get_type_address('string')){
    other = typecast({obj: vm.static_value(other), type: {static_value:'string'}})
  }
  if (!index || (index && index.__classifier__ !== vm.get_type_address('number')))
  index = {static_value:undefined}
  else index = vm.static_value(index)

  vm.exec({executable: str.__print__, location: result=>{
    let res = concat_(result.static_value, other.static_value, index.static_value)
    vm.air_object(res, options)
  }})
}


const index = (args, vm, options)=>{
  let {str, n} = args;

  if (n.__classifier__ !== vm.get_type_address('number')){
    return vm.air_object(null, options)
  }else n = vm.static_value(n)

  vm.exec({executable: str.__print__, location:result=>{
    vm.air_object(result.static_value[n.static_value] || null, options)
  }})
}


const indexof = (args, vm, options)=>{
  let {str, char} = args;

  if (char.__classifier__ !== vm.get_type_address('string')){
    return vm.air_object(-1, options)
  }else char = vm.static_value(char)

  vm.exec({executable: str.__print__, location: result=>{
    vm.air_object(result.static_value.indexOf(char.static_value), options)
  }})
}


const includes = (args, vm, options)=>{
  let {str, chars} = args;

  if (chars.__classifier__ !== vm.get_type_address('string')){
    return vm.air_object(false, options)
  }else chars = vm.static_value(chars)

  vm.exec({executable: str.__print__, location: result=>{
    vm.air_object(result.static_value.includes(chars.static_value), options)
  }})
}

const split = (args, vm, options)=>{
  let {str, char} = args;

  if (!char){
    if (char.__classifier__ !== vm.get_type_address('string')){
      return vm.air_object([str], {...options, flat:true})
    }else char = vm.static_value(char)
  }else char = {static_value: ' '}

  vm.exec({executable: str.__print__, location: result=>{
    vm.air_object(result.static_value.split(char.static_value), options)
  }})
 
}

 const trim_start=(str, chars)=> {
  let regex = new RegExp(`^[${chars}]+`, 'g');  
  return str.replace(regex, '');
}

 const trim_end=(str, chars)=> {
  let regex = new RegExp(`[${chars}]+$`, 'g');  
  return str.replace(regex, '');
}

 const trimmer=(str, chars)=> {
  return trim_start(trim_end(str, chars), chars);  
}

const trim = (args, vm, options) =>{
  let {str, char, type} = args;

  if (!char || (char.__classifier__ !== vm.get_type_address('string'))){
    char = {static_value: ' '}
  }else char = vm.static_value(char)

  if ( !type || (type.__classifier__ !== vm.get_type_address('number'))) type = {static_value: 0} 
  else type = vm.static_value(type)

  vm.exec({executable: str.__print__, location: result=>{
    let val = result.static_value
    switch(type.static_value){
      case 0:
        val = trimmer(val, char.static_value)
        break;
      case 1:
        val = trim_start(val, char.static_value)
        break;
      case 2:
        val = trim_end(val, char.static_value)
        break;
    }
    vm.air_object(val, options)
  }})
}

const repeat = (args, vm, options)=>{
  let {str,n } = args

  if (!n){
    return {result:str}
  }
  if (n.__classifier__ !== vm.get_type_address('number')){
    return vm.air_object(null, options)
  }

  n = vm.static_value(n)

  vm.exec({executable: str.__print__, location: result => {
    vm.air_object(result.static_value.repeat(n.static_value), options)
  }})
}

export {slice, index, indexof, concat, case_, split, trim, repeat, includes}