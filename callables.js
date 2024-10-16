import { get, set } from "./Executables/functions/indices";
import { display } from "./Executables/functions/display";
import typecast from "./Executables/functions/typecast";
import { ops } from "./opcodes/add";
import operation from "./Executables/functions/op";
import assign from "./Executables/functions/assign";
import importcheck from "./Executables/functions/importcheck";
import set_error_catch from "./Executables/functions/set_error_catch";
import string_register from "./Executables/functions/string_register";
import array_register from "./Executables/functions/array_register";
import twain_register from "./Executables/functions/twain_register";
import price_register from "./Executables/functions/price_register";
import folder_register from "./Executables/functions/folder_register";
import chain_register from "./Executables/functions/servers/chain_register";
import block_register from "./Executables/functions/servers/block_register";
import account_register from "./Executables/functions/servers/account_register";
import len from "./Executables/functions/len";
import { get_address, get_id } from "./Executables/functions/utils";
import adm_register from "./Executables/functions/adminstrator/adm_register";

const callables = account => {
  let add_callable= account.vm.add_callable;

  chain_register(account)
  block_register(account)
  account_register(account)
  price_register(account)
  folder_register(account)
  string_register(account)
  array_register(account)
  twain_register(account)
  adm_register(account)

  add_callable('read_chain', {
    callable:(args, vm, options)=> {
      let res = account.vm.read_chain(args.address, args.options)

      if (typeof options.location === 'string'){
        vm.write_chain(res, options.location)
      }
      return res;
    },
    config: {
      parameters: [
        {name:'address', position:0,},
        {name: 'options', position:1}
      ]
    }
  })


  add_callable('air_object', {
    callable: (args, vm, options)=>{
      vm.air_object(args.literal, options)
    }, 
    config:{
      parameters: [
        {name:'literal', position:0,}
      ]
    }
  })

  add_callable('display', {
    callable: display,
    config: {
      parameters: [
        {name:'data', position:0, spread: true}
      ]
    }
  })

  add_callable('importcheck', {
    callable: importcheck,
    config: {
      parameters: [
        {name:'address', position:0},
        {name:'names', position:1, spread: true}
      ]
    }
  })

  add_callable('set_error_catch', {
    callable: set_error_catch,
    config: {
      parameters: [
        {name:'object', position:0},
        {name:'metadata', position:1},
      ]
    }
  })

  add_callable('set', {
    callable: set,
    config: {
      parameters: [
        {name:'obj', position:0, },
        {name:'prop', position:1, },
        {name:'value', position:2, },
      ]
    }
  })

  add_callable('get', {
    callable: get,
    config: {
      parameters: [
        {name:'obj', position:0, },
        {name:'prop', position:1, }
      ]
    }
  })

  add_callable('typecast', {
    callable: typecast,
    config: {
      parameters: [
        {name:'obj', position:0, },
        {name:'type', position:1, }
      ]
    }
  })

  add_callable('assign', {
    callable: assign,
    config: {
      parameters: [
        {name:'value', position:0, }
      ]
    }
  })

  add_callable('get_address', {
    callable: get_address,
    config: {
      parameters: [
        {name:'object', position:0, }
      ]
    }
  })

  add_callable('get_id', {
    callable: get_id,
    config: {
      parameters: [
        {name:'object', position:0, }
      ]
    }
  })

  add_callable('len', {
    callable: len,
    config: {
      parameters: [
        {name:'object', position:0, }
      ]
    }
  })

  ops.map(op=>{
    add_callable(`__${op.name}__`, {
      callable: (args, vm, options)=> operation(args, vm, {...options, op: op.name}),
      config: {
        parameters: [
          {name:'left', position:0},
          {name:'right', position:1}
        ]
      }
    })
  })
}

export default callables;