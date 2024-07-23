import { obj } from "../framer";

class Opcodes {
  constructor() {
    this.opcodes = new Object();
  }

  set = (opcode, circuit) => {
    this.opcodes[opcode] = circuit;
    obj.Opcodes[opcode] = null;

    this.account.assembler.opcodes.push(opcode);
  };

  prepare_operation = (opcode, context) => {
    let circ = this.opcodes[opcode];

    if (typeof circ !== "function") return;

    let buf = context.get_buffer();

    let args =
      context.account.read(buf && buf.inputs) ||
      this.account.stdin.splice(-1)[0];

    let res = circ(args, this);

    this.stdin(res);
  };

  stdin = (object, cb) => {
    if (object == null) {
      this.flags.void = true;
      return;
    }
    this.flags.void = false;

    this.flags.zero = !object;
    if (typeof object === "number") this.flags.neg = object < 0;

    let code_string =
      typeof object !== "string" ? JSON.stringify(object) : object;

    this.account.assembler.run(code_string, { cb, pure: true });
    // console.log(`Writing in: ${code_string}`);
  };
}

export default Opcodes;
