declare class Filesystem {
  base_address: string;
  physical_address: string;
  name: string;
  hash: string;
  account: any;
  manager: any;

  constructor();

  parse_path(path: string): any;
  read(datapath: string): any;
  save(content: any, chain: any, just_obj?: boolean): string | object;
  data_addr(type: string): string;
  get_type(chain: any): string;
  write(arg: any, context: any): void;
  name_hash(): void;
  set_paths(chain: any): void;
  add_chain(name: string, parent: any): any;
  account_chain(account: any): any;
}

export default Filesystem;
