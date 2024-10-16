import { case_, concat, includes, index, indexof, repeat, slice, split, trim } from "./methods/string";

const string_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('slice_', {
    callable: slice,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'start', position:1},
        {name:'end', position:2},
      ]
    }
  })

  add_callable('concat_', {
    callable: concat,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'other', position:1},
        {name:'index', position:2},
      ]
    }
  })

  add_callable('case_', {
    callable: case_,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'type', position:1},
      ]
    }
  })

  add_callable('index_', {
    callable: slice,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'n', position:1},
      ]
    }
  })

  add_callable('indexof_', {
    callable: slice,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'char', position:1},
      ]
    }
  })

  add_callable('includes_', {
    callable: slice,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'chars', position:1},
      ]
    }
  })

  add_callable('trim_', {
    callable: trim,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'char', position:1},
        {name:'type', position:2},
      ]
    }
  })

  add_callable('split_', {
    callable: split,
    config: {
      parameters: [
        {name:'str', position:0},
        {name:'char', position:1}
      ]
    }
  })

  add_callable('repeat_', {
    callable: repeat,
    config: {
      parameters: [
        {name: 'str', position:0},
        {name: 'n', position:1},
      ]
    }
  })

  add_callable('repeat_', {
    callable: index,
    config: {
      parameters: [
        {name: 'str', position:0},
        {name: 'n', position:1},
      ]
    }
  })

  add_callable('repeat_', {
    callable: indexof,
    config: {
      parameters: [
        {name: 'str', position:0},
        {name: 'char', position:1},
      ]
    }
  })

  add_callable('repeat_', {
    callable: includes,
    config: {
      parameters: [
        {name: 'str', position:0},
        {name: 'chars', position:1},
      ]
    }
  })
}

export default string_register