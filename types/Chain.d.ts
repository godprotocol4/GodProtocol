import Block from "./Block";
import Explorer from "./Explorer";

declare class Chain extends Explorer {
  parent: any;
  account: any;
  name: string;
  physical_address: string;
  pending_children: Block[];
  connections: Block[];
  blocks: Block[];
  txs: any[];
  height: number;
  cursor: number;
  cursors: number[];
  buffs: any[];
  start_time?: number;
  hash: string;

  constructor(parent: any, name?: string);

  append_buffer(): void;
  set_cursor(cursor: number): void;
  get_buffer(): any;
  generate_hash(): void;
  get_block(index: number): Block | undefined;
  add_tx(instruction: any): void;
  mine(vm: any, no_curs?: boolean): Block;
  add_block(block: Block): void;
  get_latest_block(): Block | undefined;
  stringify(str?: boolean): string | Record<string, any>;
  add_chain(name: string): Chain;
}

export default Chain;
