import { read, readone, remove, remove_several, update, update_several, write, write_several } from "./folder";

const folder_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('read_', {
    callable: read,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })

  add_callable('readone_', {
    callable: readone,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })

  add_callable('update_', {
    callable: update,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })

  add_callable('update_several_', {
    callable: update_several,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })

  add_callable('write_several_', {
    callable: write_several,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'data', position:1},
      ]
    }
  })

  add_callable('write', {
    callable: write,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'data', position:1},
      ]
    }
  })

  add_callable('remove_several_', {
    callable: remove_several,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })

  add_callable('remove', {
    callable: remove,
    config: {
      parameters: [
        {name:'folder', position:0},
        {name:'query', position:1},
      ]
    }
  })
}

export default folder_register