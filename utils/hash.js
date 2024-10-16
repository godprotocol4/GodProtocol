const crypto = require("crypto");

const hash = (data, alg) => {
  let hash = crypto.createHash(alg|| "sha256");

  hash.update(data);

  let result = hash.digest("hex");

  return result;
};

export { hash };
