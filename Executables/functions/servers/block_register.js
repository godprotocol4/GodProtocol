import { get_block } from "./block";

const block_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('get_block_', {
    callable: get_block,
    config: {
      parameters: [
        {name:'hash', position:0},
        {name:'chain', position:1},
      ]
    }
  })
}


export default block_register