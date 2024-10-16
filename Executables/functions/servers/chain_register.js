import { explore, get_chain } from "./chain";

const chain_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('get_block_', {
    callable: get_chain,
    config: {
      parameters: [
        {name:'physical_address', position:0},
        {name:'account', position:1},
      ]
    }
  })

  add_callable('explore_', {
    callable: explore,
    config: {
      parameters: [
        {name:'chain', position:0},
        {name:'query', position:1},
      ]
    }
  })
}


export default chain_register