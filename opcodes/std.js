const stdout = (args, vm) => {
  if (!args) return;

 args&& args.op0&& vm.account.stdout.push({ data: args, pid: vm.track.pid });

  for (let v in args) console.log(args[v]);
};

export { stdout };
