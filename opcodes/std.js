const stdout = (args, vm) => {
  if (!args) return;

  vm.account.stdout.push({ data: args, pid: vm.track.pid });

  for (let v in args) console.log(args[v]);
};

export { stdout };
