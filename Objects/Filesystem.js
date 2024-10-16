import { hash } from "../utils/hash";

class Filesystem {
  constructor() {
    this.root = process.env.ROOT || __dirname;
    this.base_address = process.env.BASE_ADDRESS || "Accounts";
  }

  parse_path = (path) => {
    if (!path || (typeof path === 'string' && (!path.includes("/") || path.includes(' ')))) return path;

    return this.read(path);
  };

  read = (datapath) => {
    if (!datapath) return null;
    
    let type_folder = this.account.manager.oracle.get(datapath);

    if (!type_folder){
      return datapath;
    }

    let content;
    if (type_folder.type === "twain") {
      content = {};
      for (let prop in type_folder.obj) {
        let val = type_folder.obj[prop];

        content[this.parse_path(prop)] = this.parse_path(val);
      }
    } else if (type_folder.type === "array") {
      content = [];
      type_folder.obj.map((t) => {
        content.push(this.parse_path(t));
      });
    } else content = type_folder.obj;

    return content;
  };

  object_type = (obj, chain)=>{
    let type = typeof obj
    if (type === 'object'){
      if (Array.isArray(obj)) type = 'array'
      else if (!obj) type = 'void'
      else type = 'twain'
    }

    if (!chain)return type;

    type = `${type[0].toUpperCase()}${type.slice(1)}`
    
    return this.get_datatype_chain(type)
  }

  get_datatype_chain = (type)=>{
    let chain = this.vm.handle_chain(`${this.account.physical_address}/Datatypes/${type}`)

    return chain
  }

  save = (content, chain, options) => {
    let just_obj, pure;
    if (typeof options !== 'object'){
      just_obj = options
    }else if(options) {
      just_obj = options.just_obj
      pure = options.pure
    }
    let addr, obj;

    if (!chain){
      chain = this.object_type(content, true)
    }

    let type = typeof chain === "string" ? chain : this.get_type(chain);


    if(!pure){
      if(typeof content==='string'){
        if(type!=="string")obj= JSON.parse(content)
        else obj = content
      } else{
        if (type === "array" || type === "string") {
          obj = [];

          for (let curs in content)
            obj.splice(Number(curs) || -1, 0, content[curs]);

          if (type === "string") obj = obj.join(" ");
        } else if (type === "twain") {
          obj = {};
          for (let curs in content) {
            obj[curs] = content[curs];
          }
        } else if (type === "number") {
          obj = Number(content["-1"]);
          if (isNaN(obj)) obj = 0;
        }else if (type === 'boolean'){
          obj = content['-1']
          obj = obj === 'True' ? true:false
        } else {
          obj = null;
        }
      }
    }else obj = content
    
    if (just_obj) return obj;

    addr = `${chain.path}/${hash(JSON.stringify(obj))}`;
    this;
    if (obj != null || type === 'void') this.manager.oracle.write(addr, obj);

    this.manager.oracle.set(addr, { obj, type });

    return addr;
  };

  data_addr = (type) => {
    return `${this.physical_address}/Datatypes/${type}`;
  };

  get_type = (chain) => {
    switch (chain.physical_address) {
      case this.data_addr(`Number`):
        return "number";
      case this.data_addr(`String`):
        return "string";
      case this.data_addr(`Twain`):
        return "twain";
      case this.data_addr(`Array`):
        return "array";
      case this.data_addr(`Boolean`):
        return "boolean";
      case this.data_addr(`Void`):
        return "void";
    }
  };

  is_datatype=chain=>{

    let type = this.get_type(chain);
    return !!type
  }

  stringify_type = (type)=>{
    let val;
    switch(type){
      case 'string':
        val = ""
      break;
      case 'number':
        val = "0"
      break;
      case 'array':
        val = "[]"
      break;
      case 'twain':
        val = "{}"
      break;
      case 'void':
        val = 'null'
        break
      ;
    }
    return val
  }

  write = (arg, context) => {
    let content = context.get_buffer();

    if (!content || !arg) return;

    content[context.cursor] = arg;
  };

  name_hash = () => {
    this.hash = hash(this.name);
  };

  set_paths = (chain) => {
    if (chain.parent && chain.parent.manager) {
      chain.path = chain.parent.path;
      return;
    }
    chain.path = `${chain.parent ? chain.parent.path : this.base_address}/${
      chain.hash
    }`;

    let fs = this.manager.oracle.fs;

    if (!fs.existsSync(`${this.manager.root}/${chain.path}`)) {
      fs.mkdirSync(`${this.manager.root}/${chain.path}`, { recursive: true });
    }
  };

  add_chain = (name, parent) => {
    let chain = this.manager.web.get(`${parent.physical_address}/${name}`);
    if (!chain) chain = this.manager.web.set(parent, name);

    return chain;
  };

  account_chain = (account) => {
    let chain = this.manager.web.get(account.physical_address);

    if (!chain) {
      chain = this.manager.web.set(account);
    }

    return chain;
  };
}

export default Filesystem;
