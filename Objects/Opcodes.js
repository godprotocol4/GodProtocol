import Vm_utils from "../utils/vm_utils";
import { obj } from "../framer";

class Opcodes extends Vm_utils {
  constructor() {
    super()

    this.opcodes = new Object();
  }

  set = (opcode, circuit) => {
    this.opcodes[opcode] = circuit;
    obj.Opcodes[opcode] = null;

    this.account.assembler.opcodes.push(opcode);
  };

  prepare_operation = (opcode, context) => {
    let circ = this.opcodes[opcode];

    if (typeof circ !== "function") return;

    let buf = context.get_buffer();

    let args =
      context.account.read(buf && buf.inputs) ||
      this.account.stdin.splice(-1)[0];

      try{
        let res = circ(args, this);

        this.stdin(this.static_cast(res));
      } catch(e){
        console.log(e)
        this.stderr(`${JSON.stringify({circuit:opcode,args, error_message:e.message})}`)
      }
  };

  stdin = (object, cb, options) => {
    options = options || {}
    let full_obj = object
    object = object.static_value

    if (object == null) {
      this.flags.void = true;
      object = null
    } else this.flags.void = false;

    this.flags.zero = !object;
    if (typeof object === "number") this.flags.neg = object < 0;

    let code_string;

    if (cb && cb.payload && cb.payload.stdin)
      options.address = cb.payload.stdin;

    if (!options.address){
      let contx_2 = this.get_context(-2)
      if (full_obj&& typeof full_obj === 'object'){
        if(contx_2){
        full_obj.__address__ = contx_2.physical_address
        }else full_obj .__address__ = this.get_context().physical_address
      }
    }
    
    if (typeof full_obj === 'string'){
      code_string = full_obj
    } else if (full_obj.type){
      if (full_obj.type === 'boolean'){
        code_string =  `{"type":"boolean", "static_value":${full_obj.static_value?'True':'False'},"__address__":"${full_obj.__address__}"}`
      }else code_string = JSON.stringify(full_obj)
    }else code_string=  typeof object !== "string" ?object ==null?'Void': JSON.stringify(object) : `"${object}"`;

    if (options.address){
      let addr = options.address;
      if(!addr.startsWith('@')){
        addr = `@/${addr.split('/').slice(2).join('/')}`
      }

      code_string = `>${addr} ${code_string}`
    }
    
    this.account.assembler.run(code_string, { cb, pure: true });
  };
}

export default Opcodes;
