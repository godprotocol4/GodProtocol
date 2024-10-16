import typecast from "../typecast";

const insert = (args, vm, options) => {
  let { arr, index, value } = args;

  if (
    !index ||
    (index && index.__classifier__ !== vm.get_type_address("number"))
  )
    index = { static_value: undefined };
  else index = vm.static_value(index);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      if (index.static_value != undefined) {
        result.static_value.splice(index.static_value, 0, value.__address__);
      } else result.static_value = [...result.static_value, value.__address__];

      vm.write_chain(result, result.__address__);

      vm.air_object(result.static_value.length, options);
    },
  });
};

const pop = (args, vm, options) => {
  let { arr, index } = args;

  if (
    !index ||
    (index && index.__classifier__ !== vm.get_type_address("number"))
  )
    index = { static_value: undefined };
  else index = vm.static_value(index);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      let item;
      if (
        index.static_value != undefined ||
        index.static_value >= result.static_value.length
      ) {
        item = result.static_value.splice(index.static_value, 1);
        item = item[0];
      } else item = result.static_value.pop();

      vm.write_chain(result, result.__address__);

      vm.write_chain(vm.read_chain(item), options.location);
    },
  });
};

const repeat = (args, vm, options) => {
  let {arr, n} = args;

  if (
    !n ||
    (n && n.__classifier__ !== vm.get_type_address("number"))
  )
    n = { static_value: 0 };
  else n = vm.static_value(n);

  vm.exec({executable: arr.__print__, location: result=>{
    let og = result.static_value;
    let sv = [...result.static_value];
    
    for (let i=0; i< n.static_value; i++){
      sv.push(...og)
    }
    vm.write_chain({...result, static_value: sv}, result.__address__)
    vm.write_chain(arr, options.location)
  }})
};

const concat_ = (arr, other, index) => {
  if (index === undefined || index > arr.length) {
    index = arr.length;
  }

  let start = arr.slice(0, index);
  let end = arr.slice(index);

  arr = [...start, ...other, ...end];

  return arr;
};

const concat = (args, vm, options) => {
  let { spread } = options;
  let { arr, other, index } = args;

  if (other.__classifier__ !== vm.get_type_address("array")) {
    other = typecast({
      obj: vm.static_value(other),
      typ: { static_value: "array" },
    });
  } else other = vm.static_value(other);
  if (
    !index ||
    (index && index.__classifier__ !== vm.get_type_address("number"))
  )
    index = { static_value: undefined };
  else index = vm.static_value(index);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      let res = concat_(
        result.static_value,
        spread ? other.static_value : [other.static_value],
        index.static_value
      );
      vm.write_chain({ ...result, static_value: res }, result.__address__);

      vm.write_chain(arr, options.location);
    },
  });
};

const index = (args, vm, options) => {
  let { arr, n } = args;

  if (!n || (n && n.__classifier__ !== vm.get_type_address("number")))
    return vm.air_object(null, options);
  else n = vm.static_value(n);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      if (n.static_value < 0 ||( n.static_value >= result.static_value.length))
        return vm.air_object(null, options);

      vm.write_chain(vm.read_chain(result.static_value[n.static_value]), options.location);
    },
  });
};

const slice = (args, vm, options) => {
  let { arr, start, end } = args;

  if (start.__classifier__ !== vm.get_type_address("number")) {
    return { result: arr };
  } else start = vm.static_value(start);

  if (!end || (end && end.__classifier__ !== vm.get_type_address("number"))) {
    end = { static_value: undefined };
  } else end = vm.static_value(end);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      let new_val = result.static_value.slice(
        start.static_value,
        end.static_value
      );

      vm.air_object(new_val, options);
    },
  });
};

const clear = (args, vm) => {
  let { arr } = args;

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      result.static_value = [];
      vm.write_chain(result, result.__address__);

      vm.write_chain(arr, options.location);
    },
  });
};

const replace = (args, vm) => {
  let { arr, index, value } = args;

  if (
    !index ||
    (index && index.__classifier__ !== vm.get_type_address("number"))
  )
    return { result: arr };
  else index = vm.static_value(index);

  vm.exec({
    executable: arr.__print__,
    location: (result) => {
      result.static_value.splice(index.static_value, 1, value.__address__);

      vm.write_chain(result, result.__address__);

      vm.write_chain(arr, options.location);
    },
  });
};

const find = (args, vm, options)=>{
  let {index} = options;
  let {arr, executable} = args;

  // console.log(args, 'find.args')

  vm.exec({executable: arr.__print__, location: result=>{
    let stv = result.static_value;
    
    vm.exec({executable, metadata: {loop:{index:0, array: stv, conditioner: res=>{
      res = vm.static_value(res)
      return (res && res.static_value === true)
    }}}, arguments:{argv:[{address: stv[0], position: 0}], argc:1}, location: (result, metadata)=>{
      result = vm.static_value(result)
      if(result.static_value=== true){
        if (index){
          vm.air_object(metadata.loop.index, options)
        }else vm.write_chain(this.read_chain(stv[metadata.loop.index]), options.location)
      }else {
        vm.air_object(index? -1: null, options)
      }
    }})
  }})
}

const filter = (args, vm, options)=>{
  let {arr, executable} = args;

  // console.log(args, 'filter.args')

  vm.exec({executable: arr.__print__, location: result=>{
    let stv = result.static_value;
    let filts = []
    
    vm.exec({executable, metadata: {loop:{index:0, array: stv, conditioner: reslt=>{
      let res = vm.static_value(reslt)
      if (res && res.static_value === true){
        filts.push(reslt)
      }
      return true
    }}}, arguments:{argv:[{address: stv[0], position: 0}], argc:1}, location: (result, metadata)=>{
      vm.air_object(filts, {...options, item_type:'static_object'})
    }})
  }})
}

const map = (args, vm, options)=>{
  let {arr, executable} = args;

  // console.log(args, 'map.args')

  vm.exec({executable: arr.__print__, location: result=>{
    let stv = result.static_value;
    let mapped_values = []
    
    vm.exec({executable, metadata: {loop:{index:0, array: stv, conditioner: (res, metadata)=>{
      mapped_values.push(res)
      return metadata.loop.index+1 === stv.length
    }}}, arguments:{argv:[{address: stv[0], position: 0}], argc:1}, location: (result)=>{

      vm.air_object(mapped_values, {...options, item_type:'static_object'})

    }})
    
  }})
}

const copy = (args, vm, options)=>{
  let {arr, depth} = args;
}

export { pop, insert, repeat, map, concat, index, find, clear, slice, replace , filter, copy};
