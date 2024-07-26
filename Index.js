import Manager from "./Objects/Manager";
import create_server from "./utils/create_server";

let manager = new Manager();

let initiator = manager.initiate({
  on_framed: () =>
    initiator.assembler.run(
      `@/datastore/main

@/datastore/main/grey
>matter 'lola'
;


    >storage {}
    
    ;`,
      {
        cb: (blks) => {
          console.log(!!blks, "did");
        },
      }
    ),
});

create_server(null, { manager });

export default Manager;
export { create_server };
