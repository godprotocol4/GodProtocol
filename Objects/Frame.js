import { array_to_nested_objects } from "../utils/functions";

class Frame {
  constructor(object, parent) {
    this.parent = parent;

    this.object = Array.isArray(object)
      ? array_to_nested_objects(object)
      : object;

    this.children = new Array();
    this.instructions = new Array();
  }

  frame = (object) => {
    let frame = new Frame(object, this);

    this.instructions.push(frame);
    this.children.push(frame);

    return frame;
  };

  to_instruction = () => {
    for (let prop in this.object) {
      let val = this.object[prop];
      this.instructions.push(`chain ${prop}`);

      val && this.frame(val).to_instruction();

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
