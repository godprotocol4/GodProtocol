import Account from "./Account";
import Blockweb from "./Blockweb";
import Oracle from "./Oracle";

declare class Manager {
  accounts: { [key: string]: Account };
  running: number;
  tracks: { [key: string]: any };
  web: Blockweb;
  oracle: Oracle;
  clock: NodeJS.Timeout | null;

  constructor();

  start_clock(): void;
  get_account(name: string): Account | undefined;
  add_account(name: string, meta?: { private?: boolean }): Account;
  push(program: { sequence: string[]; account: Account; pid: string }): void;
}

export default Manager;
