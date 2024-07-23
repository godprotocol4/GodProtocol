// import fs from "fs";

declare class Oracle {
  // fs: typeof fs;
  mgr: any;
  datapaths: { [key: string]: { type: string; obj: any } };

  constructor(mgr: any);

  set(path: string, data: { type: string; obj: any }): void;

  get(path: string): { type: string; obj: any } | undefined;

  write(addr: string, data: any, meta?: { encoding: string }): void;
}

export default Oracle;
