import Chain from "./Chain"; // Adjust the import according to your project structure

declare class Block {
  chain: Chain;
  data: any;
  metadata: Record<string, any>;
  children: Block[];
  index: number;
  previous_hash?: string;
  hash?: string;
  cursor?: any;
  datapath?: string;
  timelapse?: any;

  constructor(chain: Chain);

  generate_hash(): void;
  store(no_curs?: boolean): void;
  stringify(str?: boolean): string | object;
}

export default Block;
