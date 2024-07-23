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
      obj = this[prop || "connections"].find((c) => c.hash === query[1]);
    } else if (q2 >= 0) {
      obj = this[prop || "connections"].find((q) => q.index === q2);
    } else {
      obj = this[prop || "connections"].slice(q2)[0];
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
