const getter = (args) => {
  let base = args.op0;

  // console.log(args, 'getter.args')
  if(!base)return base === ''?null: base
  
  if (typeof base === "number") return base;

  if (typeof base === "string") return base[args.op1];

  if (Array.isArray(base)) return base.slice(args.op1)[0];

  return base[args.op1];
};

const setter = (args, vm) => {
  let base = args.op0;
  
  if (typeof base === "number") return base;

  if(vm.is_readonly(args))return;

  if (typeof base === "string") {
    if (args.op1 ===0 && base.length <= 1){
      base = `${args.op2}${base}`
    } else if (args.op1 ===-1){
      base = `${base}${args.op2}`
    } else base = `${base.slice(0, args.op1)}${args.op2}${base.slice(args.op1)}`;
  } else {
    if (Array.isArray(base)) {
      if (args.op1<0|| args.op1 == null || args.op1 >= base.length) base.push(args.op2);
      else base[args.op1] = args.op2;
    } else base[args.op1] = args.op2;
  }

  return base;
};

const del = (args, vm)=>{
  let base = args.op0

  if (typeof base === 'number')return;

  if(vm.is_readonly(args))return;

  if (typeof base === 'string'){
    if (args.op1 === 0){
      base = base.slice(1)
    }else if (args === -1){
      base = base.slice(0, -1)
    }else {
      base = `${base.slice(0, args.op1)}${base.slice(args.op1+1)}`
    }
  }
  else {
    if (Array.isArray(base)){
      base.splice(args.op1, 1)
    }else delete base[args.op1]
  }
  return base;
}

const slice = (args, vm)=>{
  let obj = args.op0
  let indexes = args.op1
  if (!Array.isArray(indexes))return vm.stderr(`Indexes must be an array`)

  let res;

  if (typeof obj === 'number' ||!obj)return null;

  if (typeof obj === 'object' && !Array.isArray(obj)){
    res = {}
    indexes.map(i=>{
      res[i] = obj[i]
    })
  }else res = obj.slice(indexes[0], indexes[1])

  return res;
}

export { setter, getter , del, slice};
