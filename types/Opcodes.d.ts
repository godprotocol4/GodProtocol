declare class Opcodes {
  opcodes: { [key: string]: (args?: any) => any };

  constructor();

  set(opcode: string, circuit: (args?: any) => any): void;
  prepare_operation(opcode: string, context: any): void;
  stdin(object: any, cb?: () => void): void;
}

export default Opcodes;
