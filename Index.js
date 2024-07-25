import Manager from "./Objects/Manager";
import create_server from "./utils/create_server";

let manager = new Manager();
let initiator = manager.initiate();

setTimeout(() => {
  initiator.assembler.run(
    `@/datastore/main

@/datastore/main/grey
>matter 'lola'
;


    >storage {}
    
    ;`,
    {
      cb: (blks) => {
        console.log(
          blks.map(
            (bl) =>
              new Object({ phy: bl.chain.physical_address, index: bl.index })
          )
        );
      },
    }
  );
}, 1500);

create_server(null, { initiator });

export default Manager;
export { create_server };
