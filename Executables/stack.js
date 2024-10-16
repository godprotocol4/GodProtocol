class Stack {
  constructor(vm){
    this.vm = vm;

    this.stacks = new Object()
  }

  has_stack = (stack)=>{
    stack = this.stacks[stack]
    return !!(stack && stack.length)
  }

  initiate = (stack)=>{
    let stack_arr = this.stacks[stack]
    if(!stack_arr){
      stack_arr = new Array({})
      this.stacks[stack] = stack_arr;
    }else stack_arr.push({})
  }

  push = (stack, block)=>{
    stack = this.stacks[stack]
    if(!stack)return 
    let trace = stack.slice(-1)[0]
    
    trace[block.chain.name] = block;
  }

  pop = (stack_name)=>{
    let stack = this.stacks[stack_name]
    if (!stack)return

    let trace = stack.pop()

    this.repopulate(stack_name)

    return trace
  }

  repopulate = (stack)=>{
    let trace = this.stacks[stack].slice(-1)[0]

    for(let name in trace){
      let block = trace[name]

      let chain = this.vm.handle_chain(block.chain.physical_address)
      chain.forge_block(block.stringify())
    }
  }
}


export default Stack