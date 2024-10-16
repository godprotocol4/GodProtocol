let natives = ['Div', 'Text']

const native_components = (args, vm, options)=>{
  let {props} = args;

  vm.write_chain(props, options.location)
}

export default native_components
export {natives}