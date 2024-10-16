// import { socket_send } from "./Socket";
import callables from "./callables";
import { ops } from "./opcodes/add";
import { del, getter, setter, slice } from "./opcodes/indices";
import { jmp } from "./opcodes/jmp";
import { stdout } from "./opcodes/std";
import { post_request } from "./utils/services";

const opcodes = (account) => {
  callables(account)

  let set = account.vm.set;

  ops.map((op) => {
    if(op.jmp){
      let flag = op.name
      account.vm.flags[flag] = false
      
      set(`jmp_${flag}`, (args, vm) => jmp(args, vm, { flag }));
      set(`jmp_not_${flag}`, (args, vm) =>
        jmp(args, vm, { flag, inverse: true })
    );
    }
    
      set(op.name, (args) => {
        if (!args) return;
        try {
          let {op0, op1}=args;
          
          let type0 = op0.type
          let type1 = op1.type

          let val0 = op0.static_value;
          let val1 = op1.static_value;

          if(op.name ==='divide' && val1 === 0){
            return account.vm.stderr({name:'Zero_division_error', message: 'Do not divide by zero'})
          }

          let result = eval(`val0 ${op.sign} val1`);

          if (op.jmp) {
            result = !!result;
            account.vm.flags[op.name] = result;
          }
          
          return result;
        } catch (e) {
          console.log("opcodes: ", e.message);
          console.log(e)
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

  // Indices
  set("setter", setter);
  set("getter", getter);
  set("del", del);
  set("slice", slice);

  set("send", (data) => post_request(data, account.vm.stdin));
  // set("socket_send", socket_send);

  set("stdout", stdout);
  set("stdin",args=>account. vm.stdin(args&&args.op0));

  /* Aliases */
  set('quit', account.vm.quit)
  set('exit', account.vm.quit)
  
  set('ret', arg=>account.vm.quit(arg, 'ret'))
  
  set('exec', account.vm.exec)

  set('config', account.vm.set_config)

  set("add_server", (args) => account.add_server(args && args.op0));

  ["run", "load", "parse"].map((op) =>
    set(op, (arg) => arg && arg.op0 && account.manager.endpoint(op, arg && arg.op0))
  );

  set("add_account", (arg) =>
   account. manager.add_account({ ...arg.op0, string: true })
  );
};

export default opcodes;
