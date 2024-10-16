import { price } from "./pricing"

const price_register = (account)=>{
  let add_callable = account.vm.add_callable

  add_callable('price_', {
    callable: price,
    config: {
      parameters: [
        {name: 'commodity', position:0},
        {name: 'purpose', position:1},
        {name: 'fee', position:2},
      ]
    }
  })

  add_callable('pay_', {
    callable: price,
    config: {
      parameters: [
        {name: 'payer', position:0},
        {name: 'purpose', position:1},
        {name: 'fee', position:2},
        {name: 'payee', position:3},
      ]
    }
  })
}

export default price_register