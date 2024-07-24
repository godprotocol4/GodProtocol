import http from "http";
import { is_port_available } from "./functions";

let PORT = Number(process.env.PORT) || 1408;

const cb = (res, data) => {
  if (typeof data !== "string") data = JSON.stringify(data);

  res.end(data);
};

let extensions = new Object();

const extension = (route, handler) => {
  extensions[route] = handler;
};

const handle_routes = (req, res, app, initiator) => {
  let data = "";

  let is_in_default_routes = [
    "run",
    "load",
    "parse",
    "create_account",
  ].includes(req.url.slice(1));

  if (is_in_default_routes || (!is_in_default_routes && !app)) {
    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return cb(res, {
          error_message: "Invalid data",
          url: req.url,
          error: true,
        });
      }

      if (req.url === "/create_account") {
        let account = initiator.create_account(data);
        res.end(account.stringify(true));
      } else if (["run", "load", "parse"].includes(req.url.slice(1))) {
        let payload = {
          ...data,
          callback: (datagram) => cb(res, datagram),
        };
        initiator.endpoint(req.url.slice(1), payload);
      } else {
        let extension = extensions[req.url.slice(1)];

        if (typeof extension !== "function") {
          res.end("");
        } else extension(data, { req, res });
      }
    });

    req.on("error", (e) => {
      // res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: e.message }));
    });
  } else {
    app && app(req, res);
  }
};

const create_server = async (app, settings) => {
  settings = settings || {};

  let port = settings.port || PORT,
    port_search = settings.port_search;

  if (port_search) {
    let av = await is_port_available(port);

    while (!av) {
      port++;
      av = await is_port_available(port);
    }
  }
  PORT = port;

  let server = http.createServer((req, res) =>
    handle_routes(req, res, app, settings.initiator)
  );

  server.listen(port, () => {
    console.log(`\n...GOD PROTOCOL RUNNING :${port}`);
  });
};

export default create_server;
export { PORT, extension };
