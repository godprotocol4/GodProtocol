// import { socket_send } from "./Socket";
import { ops } from "./opcodes/add";
import { getter, setter } from "./opcodes/indices";
import { jmp } from "./opcodes/jmp";
import { stdout } from "./opcodes/std";
import { post_request } from "./utils/services";

const opcodes = (account) => {
  let set = account.vm.set;

  ops.map((op) => {
    if (op.jmp) {
      let flag = op.name;
      account.vm.flags[flag] = false;

      set(`jmp_${flag}`, (args, vm) => jmp(args, vm, { flag }));
      set(`jmp_not_${flag}`, (args, vm) =>
        jmp(args, vm, { flag, inverse: true })
      );
    }

    set(op.name, (args) => {
      if (!args) return;

      try {
        let { op0, op1 } = args;
        let result = eval(`op0 ${op.sign} op1`);

        if (op.jmp) {
          account.vm.flags[op.name] = !!result;
          return Number(!!result);
        }

        return result;
      } catch (e) {
        console.log("opcodes: ", e.message);
      }
    });
  });

  Object.keys(account.vm.flags).map((flag) => {
    set(`jmp_${flag}`, (args, vm) => jmp(args, vm, { flag }));
    set(`jmp_not_${flag}`, (args, vm) =>
      jmp(args, vm, { flag, inverse: true })
    );
  });
  set("jmp", jmp);

  set("setter", setter);
  set("getter", getter);

  set("send", (data) => post_request(data, account.vm.stdin));
  // set("socket_send", socket_send);

  set("stdout", stdout);

  set("hold", (arg) => (vm.track.hold = !!arg.op0));

  set("add_server", (args) => account.add_server(args && args.op0));

  ["run", "load", "parse"].map((op) =>
    set(
      op,
      (arg) => arg && arg.op0 && account.manager.endpoint(op, arg && arg.op0)
    )
  );

  set("add_account", (arg) =>
    account.manager.add_account({ ...arg.op0, string: true })
  );
};

export default opcodes;
