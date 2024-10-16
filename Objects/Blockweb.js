import Chain from "./Chain";

class Blockweb {
  constructor(mgr) {
    this.mgr = mgr;
    this.physical_addresses = new Object();
    this.chains = new Object();
  }

  get = (addr) => {
    let hash = this.physical_addresses[addr];

    let chain = this.chains[hash];

    return chain;
  };

  split_set = (physical_address) => {
    let spli = physical_address.split("/");

    let chain = this.get(physical_address);
    if (!chain && spli.length >1) {
      chain = this.set(spli.slice(0, -1).join("/"), spli.slice(-1)[0]);
    }
    return chain;
  };

  set = (parent, name) => {
    if (typeof parent === "string") {
      parent = this.get(parent) || this.split_set(parent);
    }

    let chain = new Chain(parent, name);
    this.chains[chain.hash] = chain;

    this.physical_addresses[chain.physical_address] = chain.hash;
    this.chains[chain.hash] = chain;

    return chain;
  };
}

export default Blockweb;
