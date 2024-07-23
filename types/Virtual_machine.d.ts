import Opcodes from "./Opcodes";

declare class Virtual_machine extends Opcodes {
  account: any;
  contexts: any[];
  stack: any[];
  track: any;

  constructor(context: any);

  get_context(index?: number): any;

  parse_arg(arg: string, is_cursor: boolean): any;

  split_instruction(instruction: string): { opcode: string; args: string };

  execute(instruction: string, track: any): void;
}

export default Virtual_machine;
