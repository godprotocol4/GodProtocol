let hash_for_twain = (str, vm) => {
  let hash = vm.account.manager.oracle.hash;
  let val = hash(str, "sha-1");

  if (!isNaN(parseInt(val[0]))) val = `_${val.slice(0, -1)}`;

  return val;
};

const get = (args, vm, options) => {
  let { twain, prop } = args;

  if (twain.__classifier__ !== vm.get_type_address("twain")) {
    return vm.stderr({
      name: "Type_error",
      message: "Must be of type `twain`",
    });
  }

  let static_twain = vm.static_value(twain);

  vm.exec({
    executable: prop.__print__,
    location: (prop_result) => {
      prop_result = vm.static_value(prop_result);

      let val = hash_for_twain(prop_result.static_value, vm);

      let pair = static_twain.static_value[val];
      if (!pair) vm.air_object(null, options);
      else {
        let value = vm.read_chain(pair[1], { tell_callable: true });
        vm.write_chain(value.output, options.location, {
          is_callable: value.callable,
        });
      }
    },
  });
};

const set = (args, vm, options) => {
  let { twain, prop, value } = args;

  if (twain.__classifier__ !== vm.get_type_address("twain")) {
    return vm.stderr({
      name: "Type_error",
      message: "Must be of type `twain`",
    });
  }

  let static_twain = vm.static_value(twain);

  if (
    ![
      vm.get_type_address("number"),
      vm.get_type_address("string"),
      vm.get_type_address("boolean"),
      vm.get_type_address("void"),
    ].includes(prop.__classifier__)
  ) {
    return vm.stderr({
      name: "Key_error",
      message: "Key type is not hashable",
    });
  }

  let prop_static = vm.static_value(prop);
  let val = hash_for_twain(prop_static.static_value, vm);

  static_twain.static_value[val] = [prop.__address__, value.__address__];

  vm.write_chain(static_twain, static_twain.__address__);

  vm.air_object(Object.keys(static_twain.static_value).length, options);
};

const entries = (args, vm, options) => {
  let { twain } = args;

  if (twain.__classifier__ !== vm.get_type_address("twain")) {
    return vm.stderr({
      name: "Type_error",
      message: "Must be of type `twain`",
    });
  }

  let static_twain = vm.static_value(twain);
  let statics = [], rrays = [];

  for (let s in static_twain.static_value) {
    let addr = `${twain.__address__}/${s}`;
    rrays.push(static_twain.static_value[s])
    statics.push(addr);
  }

  let local_addresses = statics.map((s) => `${s}_object`);

  local_addresses.map((l, i)=>{
    vm.air_object(rrays[i], {...options, location:l})
  })
  
  vm.air_object(local_addresses, options)
};

const keys = (args, vm, options) => {
  let { twain } = args;

  if (twain.__classifier__ !== vm.get_type_address("twain")) {
    return vm.stderr({
      name: "Type_error",
      message: "Must be of type `twain`",
    });
  }

  let static_twain = vm.static_value(twain);
  let statics = [];

  for (let s in static_twain.static_value) {
    statics.push(static_twain.static_value[s][0]);
  }

  vm.air_object(statics, options)
};

const unset = (args, vm, options) => {
  let {twain, prop} = args;

  let prop_static = vm.static_value(prop)
  let twain_static = vm.static_value(twain)

  let hash = hash_for_twain(prop_static.static_value)
  let has = twain_static.static_value.hasOwnProperty(hash)
  if (!has){
    return vm.air_object(null, options)
  }

  let value = twain_static.static_value[hash]

  let value_obj = vm.read_chain(value[1], {tell_callable:true})

  delete twain_static.static_value[hash]

  vm.write_chain(twain_static, twain_static.__address__)

  vm.write_chain(value_obj.output, options.location, {is_callable: value_obj.callable})
};

export { get, set, entries, keys, unset };
