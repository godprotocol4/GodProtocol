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
};

const framer = (initiator, cb) => {
  let frame = new Frame(obj);
  frame.to_instruction();
  let instructions = frame.flatten_instructions();

  let start = Date.now();
  initiator.load({
    program: { instructions },
    callback: (blks) => {
      console.log(
        `Account:${initiator.name} is ready in ${Date.now() - start}ms.`
      );

      cb && cb(blks);
    },
  });
};

export default framer;
export { obj };
