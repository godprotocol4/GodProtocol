import { _id } from "generalised-datastore/utils/functions";
import Repository from "./repository";

let num_pattern = /^\d+(\.\d+)?$/;
let var_pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
let addr_pattern = /^(@\/|\.\.\/|\.\/)?([A-Za-z0-9_\-]+\/)*[A-Za-z0-9_\-]+$/

class Loader {
  constructor(account) {
    this.account = account;
    this.opcodes = new Array();
    this.instructions = new Array();

    this.instruction_indexes = new Array();
    this.instruction_stacks = [[]];
    this.stacks = new Array(account.physical_address);
    this.markers = new Array();
    this.program_configs = new Array();
    this.programs_index = -1;
    
    this.datatypes = new Array('twain', 'string','void', 'boolean', 'array', 'number')
    this.configs = new Object()

    // Code Repository
    this.repository = new Repository(this);
  }

  instruction_index = () => {
    let len = this.instruction_indexes.length -1
    this.instruction_indexes[len]++

    return this.instruction_indexes[len]
  };

  stack_instruction = (instruction) => {
    if (Array.isArray(instruction))
      return instruction.map((i) => this.stack_instruction(i));
      
    this.instruction_stacks.slice(-1)[0].push(instruction);
  };

  new_stack = (addr) => {
    this.stacks.push(addr);
  };

  push_instruction = (instruction) => {
    if (Array.isArray(instruction))
      return instruction.map((i) => this.push_instruction(i));

    if (this.pure) {
      this.instructions.push(instruction);
    } else {
      this.stack_instruction(`cursor ${this.instruction_index()}`);

      this.stack_instruction(`write ${instruction}`);
    }
  };

  parse_tokens = (line, options) => {
    options = options ||{}
    let {stop_char, all_static, inline} = options;

    let tokens = new Array();
    let pos = 0;
    all_static = this.pure || this.no_static?false: all_static == undefined? true: all_static;

    let push_token = (value, type) =>{   
      if (stop_char){
        if (['variable','address', 'inline_address'].includes(type)) {
          all_static = false
        }
      }
      let tok_obj = { value, type, line: this.line_count, pos : pos-value.length}
      if (['twain', 'array'].includes(type)){
        tok_obj.all_static = all_static
      }

       tokens.push(tok_obj);
      };

    line = line.trim();
    while (pos < line.length) {
      let char = line[pos].trim();

      if (char === stop_char) return { tokens, pos, all_static};

      if (!char) {
        pos++;

        continue;
      }

      if (char === "\n") {
        pos++;
      } else if (char === '/' && line[pos+1]==='/'){
          pos = line.length
      }else if (char === '%' && inline){
        pos++
        let acc = line[pos]
        pos++
        while (line[pos] && var_pattern.test(`${acc}${line[pos]}`)) {
          acc += line[pos];
          pos++;
        }
        push_token(acc, "inline_address");
      } else if (char === "@" || char === ".") {
        let acc = "";
        while (line[pos] && line[pos].trim() && (line[pos] !== stop_char) && ![','].includes(line[pos]) ) {
          acc += line[pos];
          pos++;
        }
        push_token(acc, "address");
      } else if (char === ",") {
        pos++;
      } else if (char === ":") {

        push_token(char, "separator");
        pos++;
      } else if (char === "[") {
        pos++;
        let pre_stat = all_static
        if(!stop_char && !this.pure)all_static = true;
        
        let toks = this.parse_tokens(line.slice(pos),{stop_char: "]", all_static});
        if(stop_char) all_static = toks.all_static && all_static
        else all_static = toks.all_static 

        push_token([...toks.tokens], "array");
        all_static = pre_stat

        pos += toks.pos + 1;
      } else if (char === "{") {
        pos++;
        let pre_stat = all_static
        if(!stop_char && !this.pure)all_static = true;
        
        let toks = this.parse_tokens(line.slice(pos), {stop_char: "}", all_static});
        if(stop_char) all_static = toks.all_static && all_static
        else all_static = toks.all_static 

        push_token([...toks.tokens], "twain");
        all_static = pre_stat
        pos += toks.pos + 1;
      } else if (char === ">") {
        pos++;
      } else if (char === "'" || char === '"') {
        let acc = "";
        pos++;
        while (line[pos] !== char) {
          if (!line[pos]) break;
          acc += line[pos];
          pos++;
        }
        pos++;
        push_token(acc, "string");
      } else if (num_pattern.test(char) || char === "-") {
        let acc = char;
        pos++;
        while (
          num_pattern.test(line[pos]) ||
          (line[pos] === "." && !acc.includes(line[pos]))
        ) {
          if (!line[pos]) break;

          acc += line[pos];
          pos++;
        }
        push_token(acc, "number");
      } else if (var_pattern.test(char) || char === '(') {
        let depthed = char==='('
        let acc;
        if (depthed){
          pos++
          acc =line[pos]
        }else acc = char
        
        pos++;
        while (line[pos] && var_pattern.test(`${acc}${line[pos]}`)) {
          acc += line[pos];
          pos++;
        }
        
        if (depthed){
          if (line[pos] !== ')')throw new Error('Unbounded')
          acc = `(${acc})`
          pos++
        }
        
        acc = acc.trim()
        push_token(acc, ['True', 'False'].includes(acc)?'boolean':  acc ==='Void'?'void':this.opcodes.includes(acc) ? "opcode" : "variable");

      }
    }
    
    return tokens;
  };

  static_parse = ({token, previous_pure, options, identifier}, fn)=>{
    this.pure = token.all_static?'stack':previous_pure

    let physical_address = this.stacks.slice(-1)[0]
    if(!identifier && token.all_static && !options.all_static){
      identifier = {value: this.account.manager.oracle.hash(token, 'sha-1')}
      if (!isNaN(Number(identifier.value[0]))){
        identifier.value = `_${identifier.value}`
      }
    }
    if (token.all_static && !options.all_static){
      this.push_instruction(`link ${physical_address}/${identifier.value}`)
    }

    fn()

    if (token.all_static && identifier &&!options.all_static){
      this.push_instruction([
        'cursor {output}',
        'write {datapath:-1}'
      ])
      this.push_instruction(`pop ${identifier.value}`)
    }

    this.pure = previous_pure

    !options.all_static && token.all_static && !options.identifier &&
    this.push_instruction([`link ${physical_address}/${identifier.value}`, `pop ${identifier.value}`])
  }

  parse = (token, options) => {
    options = options || {}
    let {identifier} = options;

    let previous_pure = this.pure;
    if (token.type === "string" || token.type === "number") {
      this.static_parse({options, previous_pure, token, identifier}, ()=>{
        this.push_instruction([
          `link ${
            this.account.physical_address
          }/Datatypes/${`${token.type[0].toUpperCase()}${token.type.slice(1)}`}`,
          `write ${token.value}`,
          `pop ${token.type}`,
        ]);
      })

    } else if (token.type === "array") {
     
      this.static_parse({token, previous_pure, options, identifier}, ()=>{
        this.push_instruction(
          `link Accounts/${this.account.name}/Datatypes/Array`
        );
        if (token.value.length){
          token.value.map((item, i) => {
            this.parse(item, {all_static: this.pure === 'stack'});

              this.push_instruction([
                `cursor ${i}`,
                `write ${
                  this.is_not_literal(item.type)
                    ? "{metadata.output:-1}"
                    : "{datapath:-1}"
                }`,
              ]);
          });
        }
        
        this.push_instruction(`pop Array`);
      })

    } else if (token.type === "twain") {
     
      this.static_parse({token, previous_pure, options, identifier}, ()=>{
        this.push_instruction(
          `link Accounts/${this.account.name}/Datatypes/Twain`
        );
  
        if (token.value.length){
           let curs = true;
          token.value.map((entry) => {
            if (entry.type === "separator") {
              curs = false;
              return;
            }
            this.parse(entry, {all_static: this.pure === 'stack'});
            if (curs) {
              {
                this.push_instruction(
                  `cursor {*${
                    this.is_not_literal(entry.type)
                      ? "metadata.output:-1"
                      : "datapath:-1"
                  }}`
                );
              }
            } else {
              this.push_instruction(
                `write ${
                  this.is_not_literal(entry.type)
                    ? "{metadata.output:-1}"
                    : "{datapath:-1}"
                }`
              );
              curs = true;
            }
          });
        }
       
        this.push_instruction(`pop Twain`);
  
      })
     
    } else if (token.type === "variable") {
      let tok_value = token.value;

      let is_nested = this.handle_nested(tok_value)

      this.push_instruction([
        `link ${is_nested?'{metadata.output:-1}': `${this.stacks.slice(-1)[0]}/${tok_value}`}`,
        `pop ${tok_value}`,
      ]);
    }else if(token.type==='void'){
      this.push_instruction([`link ${this.account.physical_address}/Datatypes/Void`, 'pop Void'])
    }else if (token.type === 'boolean'){
      this.push_instruction([`link ${this.account.physical_address}/Datatypes/Boolean`, `write ${token.value}`, 'pop Boolean'])
    } else if (token.type === "address") this.parse_assignment(token);
  };

  handle_nested = tok_value=>{
    let is_nested= tok_value.startsWith('(')
    if (is_nested){
      let val = tok_value.slice(1,-1)
      if(val.startsWith('@') || val.startsWith('.')){
        val = this.resolve_addr(val)
        this.push_instruction([`link ${val}`, 'pop'])
      } else this.push_instruction([`link ${`${this.current_program().physical_address}/${val}`}`, `pop ${val}`])
    }

    return is_nested
  }

  throw_error=(msg, token)=>{
    let pth = this.current_program()
    pth = pth.physical_address
    throw new Error(`${msg}:${this.line_count}/col:${token.pos}\n\t${pth||''}`)
  }

  is_not_literal = (type) =>
    !type || ["variable", "opcode", "address"].includes(type);

  parse_assignment = (line, linked) => {
    let tokens = linked || line.type ? line : this.parse_tokens(line);

    let identifier = tokens[0], is_nested, curr_program;
    
    if (linked || line.type) {
      let line_split = (line.value || line)
        .slice(line.value ? null : 1)
        .trim()
        .split(" ");
      let path = line_split[0].split("/");

      this.push_instruction(`link ${this.resolve_addr(path.join("/"))}`);

      tokens = !line.type && this.parse_tokens(line_split.slice(1).join(" "));
      tokens.unshift && tokens.unshift(null);
      if (line.type === "address")
        return this.push_instruction(`pop ${path[path.length - 1]}`);
    } else {
      curr_program = this.current_program();
      curr_program && curr_program.dimensions.push({ name: identifier.value });

       is_nested = this.handle_nested(identifier.value)

      this.push_instruction(`chain ${is_nested?'{metadata.output:-1}': identifier.value}`);


      if (tokens.length > 1){
        let pre_tok = tokens.slice(-1)[0]
        if (pre_tok.all_static){}
        else
        !is_nested && this.stack_instruction([
          `link ${this.stacks.slice(-1)[0]}`,
          `chain ${identifier.value}`,
          `pop ${identifier.value}`,
          "pop",
        ]);
      }
     
    }

    let prev_token;
    if (tokens[1] && tokens[1].type === "opcode") {
      this.parse_opcode(tokens.slice(1));
      prev_token = tokens[1];
    } else {
      tokens.slice(1).map((tok) => {
        this.parse(tok, {identifier});
      });
      prev_token = tokens.slice(-1)[0];
    }

    if (!this.pure&& !is_nested && identifier.type === 'variable'){
       let config = this.configs[curr_program.physical_address]
        if(!config){
          config = {
            parameters:[], 
            identifiers: [], 
            name: curr_program.program_name, 
            __address__: curr_program.physical_address, 
            type:'module'
          }
          this.configs[curr_program.physical_address] = config;
        }else {
          // console.log(config, 'conff')
        }

        if (tokens[1]&& this.datatypes.includes(tokens[1].type)){
          config.parameters.push({name: identifier.value, object: tokens[1].static_value, position: config.parameters.length})
        }else if (!tokens[1]){
          config.parameters.push({name: identifier.value, address: `${this.account.physical_address}/Datatypes/Void`, position:config.parameters.length})
        }
        config.identifiers.push(identifier.value)
    }
   
    if (tokens.length > 1) {
      if (prev_token && prev_token.all_static){
        this.push_instruction([`pop ${identifier.value}`])
      }else {
         this.push_instruction([
          "cursor {output}",
          `write ${
            this.is_not_literal(prev_token && prev_token.type) 
              ? "{metadata.output:-1}"
              : "{datapath:-1}"
          }`,
          `pop ${identifier.value}`,
        ]);
      }
     
    } else this.push_instruction(`pop ${identifier.value}`);


  };

  current_program = () => {
    return this.program_configs[this.programs_index];
  };

  marker_pattern = /@[a-zA-Z_][a-zA-Z0-9_]*/;

  parse_opcode = (line, assign) => {
    let tokens = Array.isArray(line) ? line : this.parse_tokens(line);

    let op = tokens[0];

    if (op.type !== "opcode") return this.parse(op);

    this.push_instruction([
      `link Accounts/${this.account.name}/Opcodes/${op.value}`,
      `link Accounts/${this.account.name}/Datatypes/Twain`,
    ]);

    tokens.slice(1).map((tok, i) => {
      if (tok.type === "address" && tok.value.match(this.marker_pattern)) {
        this.push_instruction([
          `link ${this.account.physical_address}/Datatypes/Number`,
          `write ${tok.value}`,
          `pop Number`,
        ]);
      } else this.parse(tok);

      this.push_instruction([
        `cursor op${i}`,
        `write ${
          tok.all_static || (this.is_not_literal(tok.type) &&
          !(tok.type === "address" && tok.value.match(this.marker_pattern)))
            ? "{metadata.output:-1}"
            : "{datapath:-1}"
        }`,
      ]);
    });

    this.push_instruction([
      "pop Twain",
      "cursor inputs",
      `write {datapath:-1}`,
      op.value,
      `cursor {output}`,
      `write {datapath:-1}`,
      `pop ${op.value}`,
    ]);
  };

  resolve_addr = (addr) => {
    let real_addr = addr;
    addr = addr.split("/");

    if (addr.length === 1){
      real_addr = addr.join('')
    }
    else if (addr[0] === "@") {
      addr[0] = this.account.physical_address;
      real_addr = addr.join("/");
    } else if (addr[0] === ".." || addr[0] === ".") {
      let curr_addr = this.stacks.slice(-1)[0].split("/");
      while (addr[0] === ".." || addr[0] === ".") {
        if (addr[0] === "..") curr_addr.splice(-1);
        delete addr[0];
      }
      real_addr = curr_addr.join("/") + `${addr.join("/")}`;
    }

    return real_addr;
  };

  new_stack_instructions = (new_stack) => {
    let curr_stack = this.stacks.slice(-1)[0].split("/");
    new_stack = new_stack.split("/");

    let physical_address = new_stack.join("/");
    let program = {
      program_name: new_stack[new_stack.length - 1],
      physical_address,
      codes: [],
      dimensions: [],
      sub_programs: [],
      _id: _id("programs"),
    };
    let curr_program = this.current_program();
    if (curr_program) curr_program.sub_programs.push(program._id);

    this.programs_index++;
    this.program_configs.push(program);

    if (curr_stack[1] !== new_stack[1]) {
    } else {
      for (let j = 2; j < new_stack.length; j++)
        this.stack_instruction(`chain ${new_stack[j]}`);

      this.stack_instruction(
        `link ${this.account.physical_address}/Datatypes/Array`
      );
    }
  };

  parse_routine = (line) => {
    let addr = this.resolve_addr(line);

    this.instruction_stacks.push([]);
    this.new_stack_instructions(addr);
    this.new_stack(addr);

    this.instruction_indexes.push(-1);
  };

  pop = () => {
    let addr = this.stacks.splice(-1)[0].split("/");
    this.stack_instruction([
      `pop Array`,
      `cursor {program}`,
      `write {datapath:-1}`,
    ]);

    for (let j = 2; j < addr.length; j++)
      this.stack_instruction(`pop ${addr[j]}`);

    this.instructions.push(...this.instruction_stacks.splice(-1)[0]);
    this.programs_index--;

    this.instruction_indexes.pop();
  };

  revamp_marks = () => {
    let instruction_stack = this.instruction_stacks.slice(-1)[0];

    instruction_stack = instruction_stack.map((ins) =>
      this.resolve_offset(ins, true)
    );

    this.instruction_stacks[this.instruction_stacks.length - 1] =
      instruction_stack;
  };

  handle_marker = (line) => {
    let splits = line.slice(1).split(" ");
    let name = splits[0];

    let curr_stack = this.stacks.slice(-1)[0];
    let markers = this.markers[curr_stack];
    if (!markers) {
      markers = new Object();
      this.markers[curr_stack] = markers;
    }
    
    markers[name] = this.instruction_indexes.slice(-1)[0];

    this.revamp_marks();

    return splits.slice(1).join(" ");
  };

  resolve_offset = (line, revamping) => {
    let matches = line.match(this.marker_pattern),
      value;
    if (matches) {
      let match = matches[0].slice(1);

      let curr_stack = this.stacks.slice(-1)[0];
      let markers = this.markers[curr_stack];
      if (!markers) {
        markers = new Object();
        this.markers[curr_stack] = markers;
      }
      value = markers[match];
    }

    if (typeof value === "number")
      {line = line.replace(
        this.marker_pattern,
        (revamping&&value>0?value+1: value+1).toString()
      );

    }

    return line;
  };

  parse_comment = (line) => {
    line = line.split(":");
    if (line.length <= 1) return;

    let curr_program = this.current_program();
    let line1 = line[0].split(".");
    let obj = curr_program;

    for (let l = 0; l < line1.length - 1; l++) {
      let term = line1[l];

      if (term.trim() === "_id") break;

      let n_term = Number(term);

      if (n_term) {
        obj = obj[n_term];
      } else obj = obj[term];
    }
    if (!obj) return;

    let index = line1[line1.length - 1];
    let n_indx = Number(index);
    if (!isNaN(n_indx)) index = n_indx;

    if (index === "_id") return;

    obj[index] = line.slice(1).join(":").trim();
  };

  spawn = () => {
    let spaw = new Loader(this.account);
    spaw.opcodes = [...this.opcodes];

    return spaw;
  };

  line_count = 0

  compile = (codes) => {
    let code_array = codes.split("\n");

    for (let c = 0; c < code_array.length; c++) {
      let line = code_array[c].trim();
      this.line_count++

      let curr_program = this.current_program();
      this.is_routine = line.startsWith(".") || line.startsWith("@");

      this.handle_codes(line, curr_program);

      if (!line) continue;

      if (line.startsWith(":")) {
        line = this.handle_marker(line);
        if (!line) continue;
      }

      if (this.config_flag){
        this.handle_config(line)
        this.config_flag = false;
        continue;
      }

      line = this.resolve_offset(line);
      if(line.startsWith('$')){
        this.handle_decor(line)
        continue
      } else if (line === ";") this.pop();
      else if (this.is_routine) this.parse_routine(line);
      else if (line.startsWith("//")) this.parse_comment(line.slice(2).trim());
      else if (line.startsWith(">@") || line.startsWith(">."))
        this.parse_assignment(line, true);
      else if (line.startsWith(">")){
        let res =this.check_recursive(line)
        this.parse_assignment(res);
      } else this.parse_opcode(line);

      (!curr_program || this.is_routine) &&
        this.handle_codes(line, this.current_program());

        if (this.pure> 0)this.pure--
      }
      
      this.no_static = false
  };

  handle_config = config=>{
    this.pure = true
    this.parse_opcode(`config ${config}`)
    this.pure = false
  }

  check_recursive=line=>{
    line = line.slice(1).split(' ').filter(l=>!!l)

    let identifier = line[0]
    
    let recurse =  line.slice(1).find(l=>l===identifier);
    if (recurse){
      let new_var = `temp_${identifier}_${this.account.manager.oracle.hash(identifier, 'sha1')}`
      this.parse_assignment(`>${new_var} ${identifier}`)
      line = line.slice(1).map(l=>{
        if(l===identifier)return new_var
        return l
      })
      line.unshift(identifier)
    }
    
    line =`>${line.join(' ')}`

    return line
  }

  handle_decor = line=>{
    line= line.slice(1).split(' ')

    this[line[0]] = Number(line[1]) || 1
  }

  handle_codes = (line, curr_program) => {
    if (this.is_routine) {
      let tilline = `~${line}`;
      let prev_program = this.program_configs[this.programs_index - 1];
      prev_program && prev_program.codes.push(tilline);

      curr_program &&
        !curr_program.codes.find((line) => !!line.trim()) &&
        curr_program.codes.push(line);
    }

    !this.is_routine && curr_program && curr_program.codes.push(line);
  };

  run = (codes, meta) => {
    if (!meta) meta = {};
    let { pure, cb, options , unshift} = meta;
    let{main, configs}=options ||{}
    this.pure = pure? -1:0;

    this.compile(codes);

    if (meta.instructions) return [...this.instructions];

    // console.log(JSON.stringify(this.instructions, null, 2), "hiya");
    if(this.pure)this.account.log_output(this.instructions)

    this.account.load({
      program: { instructions: [...this.instructions], unshift: !!unshift},
      callback: cb,
    });

    let pragma = this.program_configs[0];
    if (pragma)
      pragma.main =
        (main) || this.repository.oracle.hash(codes);
    this.program_configs.map((config) => this.repository.add_program(config));

    if(configs === 'pragma_only'){
      this.set_config(this.configs[pragma.physical_address])
    }else {
      for (let addr in this.configs){
        let config = this.configs[addr]
        this.set_config(config)
      }
    }
    this.configs = new Object()

    this.program_configs = new Array();
    this.instructions = new Array();
    this.pure = false;
  };

  set_config = (config)=>{
    config&& 
    this.account.execute('config', {op0: config})
  }
}

export default Loader;
