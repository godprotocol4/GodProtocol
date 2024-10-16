import { array_to_nested_objects } from "../utils/functions";

class Frame {
  constructor(object, parent) {
    this.parent = parent;

    this.object = Array.isArray(object)
      ? array_to_nested_objects(object)
      : object;

    this.instructions = new Array();
  }

  frame = (object) => {
    let frame = new Frame(object, this);
    frame.account = this.account;

    this.instructions.push(frame);

    return frame;
  };

  to_instruction = () => {
    for (let prop in this.object) {
      let val = this.object[prop];
      this.instructions.push(`chain ${prop}`);

      if(val && val.__type){
        let instructions = this.account.assembler.run(JSON.stringify(val.value), {instructions: true, pure: true})

        this.instructions.push(...instructions)

        this.instructions.push(`cursor {output}`)
        this.instructions.push(`write {datapath:-1}`)
      }else val && this.frame(val).to_instruction();

      this.instructions.push(`pop ${prop}`);
    }
  };

  flatten_instructions = () => {
    let inss = new Array();

    for (let i = 0; i < this.instructions.length; i++) {
      let ins = this.instructions[i];
      if (ins instanceof Frame) inss.push(...ins.flatten_instructions());
      else inss.push(ins);
    }

    return inss;
  };
}

export default Frame;
