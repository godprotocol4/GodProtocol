import framer from "../framer";
import opcodes from "../opcodes";
import Account from "./Account";
import Blockweb from "./Blockweb";
import Oracle from "./Oracle";

class Manager {
  constructor(meta) {
    meta = meta || {};

    this.compression = meta.compression;

    this.accounts = new Object();
    this.running = 0;
    this.tracks = new Object();
    this.web = new Blockweb(this);
    this.oracle = new Oracle(this, { compression: this.compression });
  }

  initiate = (meta) => {
    let initiator = this.add_account(
      process.env.INITIATOR || "initiator",
      meta
    );

    return initiator;
  };

  start_clock = () => {
    let frequency = Number(process.env.HERTS) || 10;
    this.clock = setInterval(() => {
      for (let account in this.tracks) {
        let track = this.tracks[account];
        let program = track.slice(-1)[0];

        if (program.hold) continue;

        let instruction = program.sequence[program.pointer];

        program.account.vm.execute(instruction, program);
        program.pointer++;

        if (program.pointer === program.sequence.length) {
          program.account.flush_buffer(program.pid);

          track.pop();
        }
        if (!track.length) {
          this.running -= 1;
          delete this.tracks[account];
          program.account.chain.mine(program.account.vm);
        }
      }

      !this.running && clearInterval(this.clock);
    }, frequency);
  };

  get_account = (name) => this.accounts[name];

  add_account = (name, meta) => {
    let account = this.get_account(name);

    if (!account) {
      account = new Account(name, { ...meta, manager: this });
      opcodes(account);
      framer(account);

      this.accounts[account.name] = account;
    } else if (meta && meta.private && !account.private) {
      account.private = true;
    }

    return account;
  };

  push = (program) => {
    let track = this.tracks[program.account.name];

    if (track) {
      track.push({ ...program, pointer: 0 });
    } else {
      track = [{ ...program, pointer: 0 }];
      this.tracks[program.account.name] = track;

      this.running++;
      this.running === 1 && this.start_clock();
    }
  };
}

export default Manager;
