import { connect, load, parse, run, servers } from "godprotocol/Executables/functions/servers/account";

const account_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('connect_', {
    callable: connect,
    config: {
      parameters: [
        {name:'name', position:0},
        {name:'meta', position:1},
      ]
    }
  })

  add_callable('load_', {
    callable: load,
    config: {
      parameters: [
        {name:'account', position:0},
        {name:'payload', position:1},
      ]
    }
  })

  add_callable('parse_', {
    callable: parse,
    config: {
      parameters: [
        {name:'account', position:0},
        {name:'payload', position:1},
      ]
    }
  })

  add_callable('run_', {
    callable: run,
    config: {
      parameters: [
        {name:'account', position:0},
        {name:'payload', position:1},
      ]
    }
  })

  add_callable('servers_', {
    callable: servers,
    config: {
      parameters: [
        {name:'account', position:0}
      ]
    }
  })
}

export default account_register;