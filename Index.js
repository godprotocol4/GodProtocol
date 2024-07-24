import Manager from "./Objects/Manager";
import create_server from "./utils/create_server";

let manager = new Manager();
let initiator = manager.initiate();

create_server(null, { initiator });

export default Manager;
export { create_server };
