import { render } from "./render";
import native_components, { natives } from "./native_components";

const adm_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('render', {
    callable:render,
    config: {
      parameters:[
        {name:'object', position:0}
      ]
    }
  })
  
  natives.map(name=>{
    add_callable(name, {
      callable:(args, vm, options)=>native_components(args, vm, {...options, name}),
      config: {
        parameters:[
          {name:'props', position:0}
        ]
      }
    })
  })

}

export default adm_register;