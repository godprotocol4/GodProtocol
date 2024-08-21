class Explorer {
  constructor() {}

  chain_props = ["blocks"];

  explore = (query) => {
    if (!query) return;

    if (query.startsWith("{")) query = query.slice(1, -1);
    query = query.split(":");

    query[0] = query[0].split(".");

    let q2 = Number(query[1]),
      prop;

    if (this.chain_props.includes(query[0][0])) prop = query[0][0];

    let obj;
    if (isNaN(q2)) {
      let arr = this[prop || "connections"];
      for (let b = 0; b < arr.length; b++) {
        let blk = this.build_block(arr[b]);
        if (blk.hash === query[1]) {
          obj = blk;
          break;
        }
      }
    } else if (q2 >= 0) {
      let arr = this[prop || "connections"];
      for (let b = 0; b < arr.length; b++) {
        let blk = this.build_block(arr[b]);
        if (blk.index === q2) {
          obj = blk;
          break;
        }
      }
    } else {
      obj = this.build_block(this[prop || "connections"].slice(q2)[0]);
    }

    if (!prop)
      for (let q = 0; q < query[0].length; q++) {
        let que = query[0][q];

        if (!obj) break;
        obj = obj[que];
      }

    return obj;
  };
}

export default Explorer;
