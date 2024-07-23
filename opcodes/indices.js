const getter = (args) => {
  let base = args.op0;
  if (typeof base === "number") return base;

  if (typeof base === "string") return base[args.op1];

  if (Array.isArray(base)) return base.slice(args.op1)[0];

  return base[args.op1];
};

const setter = (args) => {
  let base = args.op0;
  if (typeof base === "number") return base;

  if (typeof base === "string") {
    base = `${base.slice(0, args.op2)}${args.op1}${base.slice(args.op2 + 1)}`;
  } else {
    if (Array.isArray(base)) {
      if (args.op2 == null || args.op2 >= base.length) base.push(args.op1);
      else base[args.op2] = args.op1;
    } else base[args.op2] = args.op1;
  }

  return base;
};

export { setter, getter };
