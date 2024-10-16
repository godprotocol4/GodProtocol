let ops = [
  { name: "add", sign: "+" },
  { name: "multiply", sign: "*" },
  { name: "subtract", sign: "-" },
  { name: "divide", sign: "/" },
  { name: "exp", sign: "**" },
  { name: "equal", sign: "==", jmp:true},
  { name: "not_equal", sign: "!=", jmp:true},
  { name: "gt", sign: ">",jmp:true },
  { name: "lt", sign: "<", jmp:true },
  { name: "lte", sign: "<=" , jmp:true},
  { name: "gte", sign: ">=", jmp:true },
];

export { ops };
