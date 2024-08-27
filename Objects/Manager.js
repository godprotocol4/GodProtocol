import { _id } from "generalised-datastore/utils/functions";
import framer from "../framer";
import opcodes from "../opcodes";
import Account from "./Account";
import Blockweb from "./Blockweb";
import Oracle from "./Oracle";
import Logger from "../utils/logger";

class Manager {
  constructor(meta) {
    meta = meta || {};

    this.compression = meta.compression;
    this.frequency = meta.frequency;
    this.manager_id = _id("manager");
    this.accounts = new Object();
    this.running = 0;
    this.logger = new Logger();
    this.root = meta.root || __dirname;
    this.accounts_et_programs = new Object();
    this.web = new Blockweb(this);
    this.oracle = new Oracle(this, {
      compression: this.compression,
      datastore: meta.datastore,
    });
    this.servers = new Array();
    this.init_name = meta.initiator || process.env.INITIATOR || "initiator";
  }

  stringify = (str) => {
    let obj = {
      _id: this.manager_id,
      servers: this.servers,
    };

    return str ? JSON.stringify(obj) : obj;
  };

  initiate = (meta) => {
    this.initiator = this.add_account(this.init_name, meta);

    return this.initiator;
  };

  state_logger = () => {
    let lines = 0;
    for (let account in this.accounts_et_programs) {
      let payload = this.accounts_et_programs[account];
      let tracks = payload.tracks;

      console.log(
        `(${payload.clocks}) Account: ${account} [tracks(${tracks.length})]`
      );

      let curr_track = tracks.slice(-1)[0];
      let pointer = curr_track.pointer;
      let instruction = curr_track.sequence[pointer];

      console.log(
        `>(${curr_track.clocks}) Track [${pointer} / ${curr_track.sequence.length}] - executing '${instruction}'`
      );
      lines += 2;
    }
    return lines;
  };

  finish_state = () => {
    console.log(`All programs finished execution`);
  };

  start_clock = () => {
    let frequency = Number(this.frequency) || Number(process.env.HERTS) || 10;
    this.clock = setInterval(() => {
      for (let account in this.accounts_et_programs) {
        let payload = this.accounts_et_programs[account];
        let tracks = payload.tracks;
        let program = tracks.slice(-1)[0];

        payload.clocks++;
        if (program.hold) continue;

        let instruction = program.sequence[program.pointer];
        program.clocks++;

        program.pointer++;
        program.account.vm.execute(instruction, program);

        if (program.pointer === program.sequence.length) {
          program.account.flush_buffer(program.pid);

          tracks.pop();
        }
        if (!tracks.length) {
          this.running -= 1;
          delete this.accounts_et_programs[account];
          program.account.chain.mine(program.account.vm);
        }
      }

      this.logger.log(this.state_logger);
      if (!this.running) {
        clearInterval(this.clock);
        this.finish_state(this.finish_state);
      }
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
    let account = this.accounts_et_programs[program.account.name];
    let tracks;

    if (account) {
      tracks = account.tracks;
      tracks.push({ ...program, pointer: 0, clocks: 0 });
    } else {
      tracks = [{ ...program, pointer: 0, clocks: 0 }];
      account = {
        tracks,
        clocks: 0,
      };
      this.accounts_et_programs[program.account.name] = account;

      this.running++;
      this.running === 1 && this.start_clock();
    }
  };

  get_initiator = () => this.initiator || this.initiate();

  endpoint = (endpoint, payload, callback) => {
    let account = this.get_account(payload.account);
    if (!account && payload.account) {
      return this.get_initiator().run_callback(callback, {
        error: true,
        error_message: "Account is not found",
        payload,
        endpoint,
      });
    } else account = this.get_initiator();

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
