const EC = require("elliptic").ec;
const ec = new EC("secp256k1"); // You can use other curves like 'ed25519' based on your requirements

/**
 * Function to validate a signature using elliptic
 * @param {string} public_key - The public key of the user
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature to be validated
 * @returns {boolean} - True if the signature is valid, false otherwise
 */
const validate_signature = (public_key, message, signature) => {
  let key = ec.keyFromPublic(public_key, "hex");
  let hash = ec.hash().update(message).digest("hex");
  let sig = {
    r: signature.slice(0, 64),
    s: signature.slice(64, 128),
  };

  return key.verify(hash, sig);
};

export default validate_signature;
