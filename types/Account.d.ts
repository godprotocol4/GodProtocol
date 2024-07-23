import Loader_sequence from "../Loader_sequence/main";
import Filesystem from "./Filesystem";
import Virtual_machine from "./Virtual_machine";

interface Meta {
  private?: boolean;
  manager?: any;
}

interface Program {
  instructions: string[];
  account: string;
}

interface LoadPayload {
  program: Program;
  signature: string;
  callback?: (data: any) => void;
}

interface ParsePayload {
  payload: any;
  signature: string;
  callback?: (data: any) => void;
}

interface RunRequest {
  payload: any;
  signature: string;
  callback?: (data: any) => void;
}

interface AccountPayload {
  name: string;
  meta?: Meta;
}

interface EndpointPayload {
  [key: string]: any;
}

declare class Account extends Filesystem {
  name: string;
  private: boolean;
  manager: any;
  account: Account;
  physical_address: string;
  compiler: Loader_sequence;
  chain: any;
  vm: Virtual_machine;
  mine_buffer: Record<string, any>;

  constructor(name: string, meta?: Meta);

  get_account(name: string): Account;
  manage_buffer(callback?: (data: any) => void): string;
  buff(block: any, pid: string): void;
  flush_buffer(pid: string): void;
  load(payload: LoadPayload): void;
  parse(payload: ParsePayload): void;
  run(request: RunRequest): void;
  run_callback(callback: any, payload: any): void;
  validate(
    payload: any,
    signature: string,
    callback?: (data: any) => void
  ): boolean;
  stringify(str?: boolean): string | object;
  create_account(payload: AccountPayload): Account;
  endpoint(endpoint: string, payload: EndpointPayload): void;
}

export default Account;
