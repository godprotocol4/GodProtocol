import { _id } from "generalised-datastore/utils/functions";
import framer from "../framer";
import opcodes from "../opcodes";
import Account from "./Account";
import Blockweb from "./Blockweb";
import Oracle from "./Oracle";
import Logger from "../utils/logger";
import Protocol from "godprotocol/Objects/Protocol";


class Manager extends Protocol{
  constructor(meta) {
    super()
    
    meta = meta || {};

    this.compression = meta.compression;
    this.frequency = meta.frequency
    this.manager_id = _id("manager");
    this.accounts = new Object();
    this.running = 0;
    this.logger = new Logger()
    this.root = meta.root || __dirname;
    this.accounts_et_programs = new Object();
    this.web = new Blockweb(this);
    this.oracle = new Oracle(this, {
      compression: this.compression,
      datastore: meta.datastore,
    });
    this.servers = new Array();
    this.init_name = meta.initiator|| process.env.INITIATOR || "initiator"
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
     this.init_name,
      meta
    );

    return this.initiator;
  };

  set_track = ({account, physical_address, pointer}, slice)=>{
    let payload = this.accounts_et_programs[account], t, track;
    
    for(t= payload.tracks.length-1; t>=0; t--){
      let trck = payload.tracks[t]
      if (trck.payload.physical_address === physical_address){
        track = trck
        break
      }
    }

    if(slice && track){
      payload.tracks.splice(t+1)
    }
    if(pointer != null){
      track.pointer = pointer;
    }

    return track
  }

  state_logger = ()=>{
    let lines=0
    for (let account in this.accounts_et_programs){
      let payload = this.accounts_et_programs[account];
      let tracks = payload.tracks

      console.log(`(${payload.clocks}) Account: ${account} [tracks(${tracks.length})]`)

      let curr_track = tracks.slice(-1)[0]
      let pointer = curr_track.pointer
      let instruction = curr_track.sequence[pointer]

      console.log(`>(${curr_track.clocks}) Track [${pointer} / ${curr_track.sequence.length}] - executing '${instruction}'`)
      lines+=2
    }
    return lines
  }

  finish_state = ()=>{
    console.log(`All programs finished execution`)
  }

  start_clock = () => {
    let frequency = Number(this.frequency)|| Number(process.env.HERTS) || 10;
    this.clock = setInterval(() => {
      
      for (let account in this.accounts_et_programs) {
        let payload = this.accounts_et_programs[account], spawn, tracks;

        if(payload.spawn_list.length){
          if(payload.spawn_cursor == undefined){
            payload.spawn_cursor = 0
            tracks = payload.tracks;
          }else {
            spawn = payload.spawn_list[payload.spawn_cursor]
            tracks = payload.spawns[spawn];
            payload.spawn_cursor ++
          }
        }else {
          tracks = payload.tracks;
        }

        let program = tracks.slice(-1)[0];

        payload.clocks ++
        if (program.hold) continue;

        let instruction = program.sequence[program.pointer];
        program.clocks++

        program.pointer++;
        program.account.vm.execute(instruction, program);
        program = program.account.vm.track;
        
        if (program.pointer >= program.sequence.length) {
          program.account.flush_buffer(program.pid);

          if (program.error_stack)
            program.account.vm.error_manager = JSON.parse(program.error_stack)
          tracks.pop();

          if(spawn){
            if (payload.spawn_cursor >= payload.spawn_list.length){
              payload.spawn_cursor = undefined
            }
          }
        }
        if (!tracks.length) {
          if (spawn){
            delete payload.spawns[spawn]
            payload.spawn_list = payload.spawn_list.filter(s=>s!==spawn)
          }else {
            this.running -= 1;
            delete this.accounts_et_programs[account];
            program.account.chain.mine(program.account.vm);
          }
          
        }
      }

      this.logger.log(this.state_logger)
      if (!this.running){
        clearInterval(this.clock)
       this. finish_state(this.finish_state)
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
    let tracks ;

    if (account) {
      if (program.spawn) {
        tracks = account.spawns[program.spawn]
        if (!tracks) {
          tracks = []
          account.spawns[program.spawn] = tracks;
        }
        account.spawn_list.push(program.spawn)
      }else tracks=  account.tracks
      if(program.unshift){
        delete program.unshift
        tracks.unshift({ ...program, pointer: 0, clocks:0 });
      } else tracks.push({ ...program, pointer: 0, clocks:0 });
    } else {
      tracks = [{ ...program, pointer: 0, clocks:0 }];
      account = {
        clocks:0,
        spawns: {},
        spawn_list: []
      }
      if (program.spawn){
        account.spawns[program.spawn] = tracks
        account.spawn_list.push(program.spawn)
      }else account.tracks = tracks;

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
    }else account = this.get_initiator()

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

  prepare_query  = query=>{
    query = query.split('&');
    let obj = {}
    for (let q=0; q< query.length; q++){
      let [prop, value] = query[q].split('=')

      if (prop === 'executable'){
        obj.executable = value;
      }else if (prop.startsWith('arguments')){
        if (!obj.arguments) obj.arguments = {argv: []}
        if (prop.includes('.')){
          prop = prop.split('.')
          if (prop[2] ==='$'){
            try{
              value = JSON.parse(value)
            }catch(e){}
          }
          obj.arguments.argv.push({name: prop[1], [prop[2]==='$'?'static_value':'address']: value})
        } else {
          obj.arguments.argv.push({address:value, position: obj.arguments.argv.length})
        }
        obj.arguments.argc = obj.arguments.argv.length
      }else if (prop === 'location'){
        obj.location = value;
      }else if (prop === 'metadata'){
        try {
          obj.metadata  = JSON.parse(value);  
        } catch (e) {}
      }
    }
    
    return obj;
  }

  handle_route = ({req,res, data})=>{
    let url = req.url;
    let split = url.split('?')
    let query = split[1]

    let payload = data || this.prepare_query(query);
    url = split[0].split('/').filter(a=>!!a)

    if (url.length> 2){}

    let account = this.get_account(data && data.account || url[1]);
    if(!account){
      return res.end(JSON.stringify({error:true, error_message:"Account is not found!"}))
    }

    if (['display', 'read_chain'].includes(payload.executable )){
      if (!payload.metadata)payload.metadata = {}
      payload.metadata.raw = true;
    }

    let response = account.vm.exec(payload)

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response))
  }
}

export default Manager;
