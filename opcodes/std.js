const stdout = (args, vm) => {
  if (!args) return;

 args&& args.op0&& vm.account.stdout.push({ data: args, pid: vm.track.pid });

  let logs = []
  for (let v in args) logs.push(args[v].static_value == null ? null :args[v].static_value);

  console.log(...logs)
};

export { stdout };
