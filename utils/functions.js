const array_to_nested_objects = (arr) => {
  if (arr.length === 0) return null;

  let [first, ...rest] = arr;
  return { [first]: array_to_nested_objects(rest) };
};

const transpile_object = (object) => {
  let code_string = "",
    type = typeof object;
  if (type === "object") {
    if (Array.isArray(object)) {
      code_string += "arr(";
      object.map((o) => {
        code_string += `${transpile_object(o)},`;
      });
      code_string = code_string.slice(0, -1);
      code_string += ")";
    } else {
      if (!object) code_string = "Void";
      else {
        code_string = "twain(";
        for (let prop in object) {
          let val = object[prop];
          code_string += `${transpile_object(prop)}:${transpile_object(val)},`;
        }
        code_string = code_string.slice(0, -1);
        code_string += ")";
      }
    }
  } else if (type === "string") {
    code_string = `"${object}"`;
  } else if (type === "number") {
    code_string = `${object}`;
  } else if (type === "boolean") {
    code_string = `${object}`;
  }

  return code_string;
};

const net = require("net");

/**
 * Check if a port is available
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - Resolves to true if the port is available, false otherwise
 */
function is_port_available(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(false); // Port is in use
      } else {
        reject(err); // Some other error
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true); // Port is available
    });

    server.listen(port);
  });
}

export { array_to_nested_objects, transpile_object, is_port_available };
