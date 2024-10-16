import {  concat, repeat, slice, pop, index, clear, insert,  replace, map, find, copy, filter } from "./methods/array";

const array_register = (account)=>{
  let add_callable = account.vm.add_callable;

  add_callable('insert_', {
    callable: insert,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'value', position:1},
        {name:'index', position:2},
      ]
    }
  })

  add_callable('arr_slice_', {
    callable: slice,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'start', position:1},
        {name:'end', position:2},
      ]
    }
  })

  add_callable('arr_concat_', {
    callable: concat,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'other', position:1},
        {name:'index', position:2},
      ]
    }
  })

  add_callable('extend_',{
    callable: (args, vm, options) => concat(args, vm, {...options, spread:true}),
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'other', position:1},
        {name:'index', position:2},
      ]
    }
  })

  add_callable('index_', {
    callable: index,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'n', position:1},
      ]
    }
  })

  add_callable('pop_', {
    callable: pop,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'index', position:1},
      ]
    }
  })

  add_callable('replace_', {
    callable: replace,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'index', position:1},
        {name:'value', position:1},
      ]
    }
  })


  add_callable('repeat_', {
    callable: repeat,
    config: {
      parameters: [
        {name: 'arr', position:0},
        {name: 'n', position:1},
      ]
    }
  })

  add_callable('clear_', {
    callable: clear,
    config: {
      parameters: [
        {name: 'arr', position:0},
      ]
    }
  })

  add_callable('findindex_', {
    callable:(args, vm, options)=> find(args, vm, {...options, index: true}),
    config: {
      parameters: [
        {name: 'arr', position:0},
        {name: 'executable', position:1},
      ]
    }
  })

  add_callable('map_', {
    callable: map,
    config: {
      parameters: [
        {name: 'arr', position:0},
        {name: 'executable', position:1},
      ]
    }
  })

  add_callable('find_', {
    callable: find,
    config: {
      parameters: [
        {name: 'arr', position:0},
        {name: 'executable', position:1},
      ]
    }
  })

  add_callable('filter_', {
    callable: filter,
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'executable', position:1},
      ]
    }
  })

  add_callable('copy_', {
    callable: copy,
    config: {
      parameters: [
        {name:'arr', position:0},
      ]
    }
  })

  add_callable('deepcopy_', {
    callable: (args, vm, options)=>copy(args, vm, {...options, deep:true}),
    config: {
      parameters: [
        {name:'arr', position:0},
        {name:'depth', position:1},
      ]
    }
  })
}

export default array_register