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

const handle_routes = (req, res, app, manager) => {
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
      if (req.method === 'GET'){
        console.log(req.url)
        if(req.url === '/' ){
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(`<h1>God Protocol</h1>`);
        }
          else if(req.url.startsWith('/Accounts') ){
          manager.handle_route({req, res});
        }

        return;
      }
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
        let account = manager.add_account(null, { ...data, string: true });

        res.end(account);
      } else if (["run", "load", "parse"].includes(req.url.slice(1))) {
        manager.endpoint(req.url.slice(1), payload, (datagram) =>
          cb(res, datagram)
        );
      } else {
        manager.handle_route({req,res, data})
      }
    });

    req.on("error", (e) => {
      // res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", error_message: e.message }));
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
    handle_routes(req, res, app, settings.manager)
  );

  server.listen(port, () => {
    console.log(`\n...GOD PROTOCOL RUNNING :${port}`);
    settings.manager.add_server({ ...settings.server_details, port: PORT });
  });
};

export default create_server;
export { PORT, extension };
