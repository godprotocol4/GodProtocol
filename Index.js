import Manager from "./Objects/Manager";
import create_server from "./utils/create_server";

let manager = new Manager();

let initiator = manager.initiate({
  on_framed: () =>
    initiator.assembler.run(
      `@/datastore/main

      >object
      >keys []
      >entries {}
      >size 0
      
      ./set
      >key
      >key_static getter key "static_value"
      >value
      >exists getter ../entries key
      jmp_not_void :proceed
      >../size add ../size 1
      >../keys setter ../keys -1 key
      
      :proceed 
      >../entries setter ../entries key_static value
      ;
      
      ./get
      >key
      >value getter ../entries key
      ;
      
      ./remove
      >key
      >../entries delete ../entries key
      >../keys delete ../keys key
      >../size sub ../size 1
      ;
      
      ./get_keys
      >output ../keys 
      ;
      

    ;`,
      {
        cb: (blks) => {
          console.log(blks, blks.length, "did");
        },
      }
    ),
});

// create_server(null, { manager });

export default Manager;
export { create_server };
