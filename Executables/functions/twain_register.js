import { entries, get, keys, set, unset } from "./methods/twain";

const twain_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('get_', {
    callable: get,
    config: {
      parameters:[
        {name: 'twain', position:0},
        {name: 'prop', position:1},
      ]
    }
  })

  add_callable('set_', {
    callable: set,
    config: {
      parameters:[
        {name: 'twain', position:0},
        {name: 'prop', position:1},
        {name: 'value', position:2},
      ]
    }
  })

  add_callable('keys_', {
    callable: keys,
    config: {
      parameters:[
        {name: 'twain', position:0}
      ]
    }
  })

  add_callable('entries_', {
    callable: entries,
    config: {
      parameters:[
        {name: 'twain', position:0}
      ]
    }
  })

  add_callable('unset_', {
    callable: unset,
    config: {
      parameters:[
        {name: 'twain', position:0},
        {name: 'prop', position:1},
      ]
    }
  })
}

export default twain_register