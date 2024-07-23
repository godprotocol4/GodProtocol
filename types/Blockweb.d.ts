import Chain from "./Chain";

declare class Blockweb {
  mgr: any;
  physical_addresses: Record<string, string>;
  chains: Record<string, Chain>;

  constructor(mgr: any);

  get(addr: string): Chain | undefined;
  set(parent: any, name: string): Chain;
}

export default Blockweb;
