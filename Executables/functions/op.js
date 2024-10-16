const operation = (args, vm, options)=>{
  let {op} = options
  let {left, right }= args;

  vm.exec({executable: left.__print__, location: (result1)=>{ 
    if(right){
      vm.exec({executable: right.__print__, location: (result2)=>{
        vm.air_object(vm.run_opcode([result1, result2], op), options)
      }})
    }else vm.air_object(vm.run_opcode([result1], op), options)
  }})

}

export default operation
