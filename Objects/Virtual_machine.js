import Opcodes from "./Opcodes";

class Virtual_machine extends Opcodes {
  constructor(context) {
    super();

    this.account = context.account;
    this.contexts = [context];
    this.stack = new Array();
    this.flags = {
      neg: false,
      equal: false,
      zero: false,
      void: false,
    };
  }

  get_context = (index) => {
    return this.contexts.slice(index == null ? -1 : index)[0];
  };

  parse_arg = (arg, is_cursor) => {
    let context = this.get_context();

    let args = arg.split("/"),
      i = 0;

    while (args[0] === "..") {
      i++;

      args.splice(0, 1);
    }

    i = (i + 1) * -1;
    context = i ? this.get_context(i) : context;

    arg = args.join("/");

    while (arg.includes("^")) {
      let blk = context.connections.slice(-1)[0];
      if (!blk) break;
      context = blk.chain;
      let i = arg.indexOf("^");
      arg = `${arg.slice(0, i)}${arg.slice(i + 1)}`;
    }

    if (arg.startsWith("{*") && is_cursor) {
      arg = context.explore(arg.slice(2, -1));
    } else if (arg.startsWith("{") && !is_cursor) {
      arg = context.explore(arg.slice(1, -1));
    }

    return arg;
  };

  split_instruction = (instruction) => {
    let split = instruction.split(" ");
    let opcode = split[0],
      args = split.slice(1).join(" ");

    return { opcode, args };
  };

  execute = (instruction, track) => {
    this.track = track;

    if (!instruction) return;

    let { opcode, args } = this.split_instruction(instruction);

    let context = this.get_context();

    if (!context) return;

    context.add_tx(instruction);

    // console.log(instruction);

    let chain;

    args = this.parse_arg(args, opcode === "cursor");

    switch (opcode) {
      case "chain":
        chain = context.account.add_chain(args, context);
        this.contexts.push(chain);

        let dim = context.folder.config.dimensions;
        if (!dim) {
          dim = [];
          context.folder.config.dimensions = dim;
        }
        !dim.find((d) => d === args) && dim.push(args);

        chain.append_buffer();

        break;
      case "link":
        chain = context.account.manager.web.get(args);

        if (!chain) {
          this.account.flush_buffer(this.track.pid, {
            error: true,
            error_message: `LINKing Failed. - ${args}`,
          });
          this.track.pointer = this.track.sequence.length;

          console.log(`LINKing Failed. - ${args}`);
          return;
        }

        chain.append_buffer();

        this.contexts.push(chain);

        break;
      case "mine":
        let bloc = context.mine(this, true);

        this.account.buff(bloc, this.track.pid);

        break;
      case "pop":
        let blk;
        if (context.txs.length > 1) {
          blk = context.mine(this);
        } else {
          blk = context.get_latest_block();
          if (blk) this.get_context(-2).connections.push(blk);

          context.txs = [];
        }
        blk && this.account.buff(blk, this.track.pid);

        this.contexts.pop();
        break;
      case "cursor":
        context.set_cursor(args);
        break;
      case "write":
        context.account.write(args, context);
        break;
      default:
        this.prepare_operation(opcode, context);
        break;
    }
  };
}

export default Virtual_machine;
