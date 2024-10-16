import Frame from "./Objects/Frame";

let obj = {
  Opcodes: {
    add: null,
    equal: null,
    multiply: null,
    subtract: null,
    divide: null,
    exp: null,
    equal: null,

    send: null,
    readonly: null,
    socket_send: null,

    jmp: null,

    stdout: null,
    stdin: null,

    run: null,
    load: null,
    parse: null,
    create_account: null,
  },
  Datatypes: {
    Number: null,
    String: null,
    Twain: null,
    Array: null,
    Void: null,
    Boolean: null,
  },
  Objects: {
    Blockchain: {
      Chain: null,
      Block: null,
    },
    Folder: {
      active_file: null,
      folder: null,
      file: null,
    },
    File: {
      row: null,
      parse: null,
      column: null,
      write: null,
    },
  },
  CONSTANTS:{
    overload: {
      __add__: {__type:'twain', value: {type:'string', static_value:'__add__'}},
      __multiply__: {__type:'twain', value: {type:'string', static_value:'__multiply__'}},
      __subtract__: {__type:'twain', value: {type:'string', static_value:'__subtract__'}},
      __divide__: {__type:'twain', value: {type:'string', static_value:'__divide__'}},
      __exp__: {__type:'twain', value: {type:'string', static_value:'__exp__'}},
      __equal__: {__type:'twain', value: {type:'string', static_value:'__equal__'}},
      // __not_equal__: {__type:'twain', value: {type:'string', static_value:'__not_equal__'}},
      __lt__: {__type:'twain', value: {type:'string', static_value:'__lt__'}},
      __lte__: {__type:'twain', value: {type:'string', static_value:'__lte__'}},
      __gt__: {__type:'twain', value: {type:'string', static_value:'__gt__'}},
      __gte__: {__type:'twain', value: {type:'string', static_value:'__gte__'}},
    },
    types: {
      instance: {__type: 'twain', value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/instance`, static_value: 'instance'}},
      function: {__type:'string', value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/function`, static_value: 'function'}},
      boolean: {__type:'string',value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/boolean`, static_value: 'boolean'}},
      array: {__type:'string',value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/array`, static_value: 'array'}},
      twain: {__type:'string',value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/twain`, static_value: 'twain'}},
      number: { __type:'string', value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/number`, static_value: 'number'}},
      string: {__type:'string', value: {type:'string', __address__:`Accounts/initiator/CONSTANTS/types/string`, static_value: 'string'}},
    }
  },
};

const framer = (initiator, cb) => {
  let frame = new Frame(obj);
  frame.account = initiator;
  let start = Date.now();

  let callback =  (blks) => {
    console.log(
      `Account:${initiator.name} is ready in ${Date.now() - start}ms.`
    );

    initiator.initiated = true

    cb&&cb(blks)
  }

  /* Quick due diligence */
  let oracle = initiator.manager.oracle,
   obj_hash = oracle.hash(obj), 
   globals = oracle.gds.folder('globals'),
   quick_hashes = globals.readone({title:'quick_hashes'});

  if(!quick_hashes){
    quick_hashes = {title:"quick_hashes"}
    let res = globals.write(quick_hashes)
    quick_hashes._id = res._id
    quick_hashes.created = res.created
  }
  if(quick_hashes.frame === obj_hash){
    setTimeout(() => {
      callback([])  
    }, 0);
  }else {
    frame.to_instruction();
    let instructions = frame.flatten_instructions();
  
    initiator.load({
      program: { instructions },
      callback,
    });
    globals.update({_id:quick_hashes._id}, {frame: obj_hash})
  }

  
};

export default framer;
export { obj };
