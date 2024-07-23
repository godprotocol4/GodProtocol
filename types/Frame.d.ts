declare class Frame {
  parent: Frame | null;
  object: any;
  children: Frame[];
  instructions: (string | Frame)[];

  constructor(object: any, parent?: Frame | null);

  frame(object: any): Frame;
  to_instruction(): void;
  flatten_instructions(): string[];
}

export default Frame;
