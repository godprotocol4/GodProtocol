const jmp = (args, vm, meta) => {
  meta = meta || {};
  let { flag, inverse } = meta;

  let condition;
  if (flag) condition = vm.flags[flag];
  if (inverse) condition = !!!condition;

  if ((condition || !flag) && typeof args.op0 === "number") {
    vm.track.pointer = args.op0;

    vm.pop_context()
  }
};

export { jmp };
