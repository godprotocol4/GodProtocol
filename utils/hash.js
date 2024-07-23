const crypto = require("crypto");

const hash = (data) => {
  let hash = crypto.createHash("sha256");

  hash.update(data);

  let result = hash.digest("hex");

  return result;
};

export { hash };
