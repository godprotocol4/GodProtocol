import create_server from "./utils/create_server"
import Manager from "./Objects/Manager";

class Trinity{
  constructor(){
    this.manager = new Manager()
  }

  create_server = (app, settings)=>{
    settings = settings||{}
    create_server(app, {...settings, manager: this.manager})
  }

  account= name=>this.manager.get_account(name)

  add_account = (name, meta) =>this.manager.add_account(name, meta)
}


export default Trinity