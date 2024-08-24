import { _id } from "generalised-datastore/utils/functions";
import framer from "../framer";
import opcodes from "../opcodes";
import Account from "./Account";
import Blockweb from "./Blockweb";
import Oracle from "./Oracle";

class Manager {
  constructor(meta) {
    meta = meta || {};

    this.compression = meta.compression;
    this.manager_id = _id("manager");
    this.accounts = new Object();
    this.running = 0;
    this.root = meta.root || __dirname;
    this.tracks = new Object();
    this.web = new Blockweb(this);
    this.oracle = new Oracle(this, {
      compression: this.compression,
      datastore: meta.datastore,
    });
    this.servers = new Array();
  }

  stringify = (str) => {
    let obj = {
      _id: this.manager_id,
      servers: this.servers,
    };

    return str ? JSON.stringify(obj) : obj;
  };

  initiate = (meta) => {
    this.initiator = this.add_account(
      process.env.INITIATOR || "initiator",
      meta
    );

    return this.initiator;
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
    meta = meta || {};
    if (!name) name = meta.name;

    let account;
    if (!name) {
      account = { error: true, error_message: "Name cannot be blank" };
    } else {
      account = this.get_account(name);

      if (!account) {
        account = new Account(name, { ...meta, manager: this });

        opcodes(account);
        framer(account, meta.on_framed);

        this.accounts[account.name] = account;
        if (meta.string) account = account.stringify();
      } else if (meta && meta.private && !account.private) {
        account.private = true;
      }
    }

    return meta.string ? JSON.stringify(account) : account;
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

  get_initiator = () => this.initiator || this.initiate();

  endpoint = (endpoint, payload, callback) => {
    let account = this.get_account(payload.account);
    if (!account) {
      return this.get_initiator().run_callback(callback, {
        error: true,
        error_message: "Account is not found",
        payload,
        endpoint,
      });
    }

    if (
      !account.validate(
        payload.program || payload.payload,
        payload.signature,
        callback || payload.callback
      )
    )
      return;

    let method = account[endpoint];
    typeof method === "function" && method({ ...payload, callback });
  };

  add_server = (server) => {
    this.servers.push(server);
  };
}

export default Manager;
