import Manager from "./Objects/Manager";
import create_server from "./utils/create_server";

let manager = new Manager();

let initiator = manager.add_account(process.env.INITIATOR || "initiator");

setTimeout(() => {
  initiator.assembler.run(
    `
    @/adder
// coder: Savvy

  >num 5
  // dimensions.0.type: number

  ./subtr

>sub_result  sub 7 8
  ;

  >result add num 6
  stdout result

  ;
    `,
    {
      cb: (blocks) => {
        initiator.run({
          payload: { physical_address: `${initiator.physical_address}/adder` },
          callback: (blks) => {
            // console.log(blks, "blocks");
          },
        });
      },
    }
  );
}, 1500);

create_server(null, { port_search: true });

export default manager;
export { initiator, create_server };
