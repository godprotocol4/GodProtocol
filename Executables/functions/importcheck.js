const importcheck = (args, vm)=>{
  console.log(args, 'importcheck.args')
  let {names} = args;

  if(!Array.isArray(names)) names = [names]

  for (let n=0; n< names.length; n++){
    let name = names[n]

  }
}

export default importcheck