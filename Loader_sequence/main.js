import { _id } from "generalised-datastore/utils/functions";

let num_pattern = /^[+-]?\d+(\.\d+)?$/;
// let str_pattern = /^["'][^"']*["']$/;
let var_pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

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

    // Code Repository
    this.oracle = this.account.manager.oracle;
    this.programs_folder = this.oracle.get_folder("programs", {
      joins: ["codes"],
    });
    this.codes_folder = this.oracle.get_folder("codes");

    this.globals = this.oracle.get_folder("globals", {
      subfolder: ["global"],
    });

    if (!this.globals.readone({ global: "programs" }))
      this.globals.write({ global: "programs", programs: [] });
    if (!this.globals.readone({ global: "codes" }))
      this.globals.write({ global: "codes", codes: [] });
  }

  instruction_index = () => {
    let index = this.instruction_indexes.slice(-1);
    index++;
    this.instruction_indexes.splice(-1, 1, index);

    return index;
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

  parse_tokens = (line, stop_char) => {
    let tokens = new Array();
    let pos = 0,
      line_number = 0;

    let push_token = (value, type) =>
      tokens.push({ value, type, line: line_number, pos });

    line = line.trim();
    while (pos < line.length) {
      let char = line[pos].trim();

      if (char === stop_char) return { tokens, pos };

      if (!char) {
        pos++;

        continue;
      }

      if (char === "\n") {
        line_number++;
        pos++;
      } else if (char === "@") {
        let acc = "";
        while (line[pos] && line[pos].trim()) {
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
        let toks = this.parse_tokens(line.slice(pos), "]");
        push_token(toks.tokens, "array");
        pos += toks.pos + 1;
      } else if (char === "{") {
        pos++;
        let toks = this.parse_tokens(line.slice(pos), "}");
        push_token(toks.tokens, "twain");
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
      } else if (num_pattern.test(char)) {
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
      } else if (var_pattern.test(char)) {
        let acc = char;
        pos++;
        while (line[pos] && var_pattern.test(`${line[pos].trim()}`)) {
          acc += line[pos];
          pos++;
        }

        push_token(acc, this.opcodes.includes(acc) ? "opcode" : "variable");
      }
    }

    return tokens;
  };

  parse = (token) => {
    if (token.type === "string" || token.type === "number") {
      this.push_instruction([
        `link ${
          this.account.physical_address
        }/Datatypes/${`${token.type[0].toUpperCase()}${token.type.slice(1)}`}`,
        `write ${token.value}`,
        `pop ${token.type}`,
      ]);
    } else if (token.type === "array") {
      this.push_instruction(
        `link Accounts/${this.account.name}/Datatypes/Array`
      );
      token.value.map((item, i) => {
        this.parse(item);

        this.push_instruction([
          `cursor ${i}`,
          `write ${
            this.is_not_literal(item.type)
              ? "{metadata.output:-1}"
              : "{datapath:-1}"
          }`,
        ]);
      });
      this.push_instruction(`pop Array`);
    } else if (token.type === "twain") {
      this.push_instruction(
        `link Accounts/${this.account.name}/Datatypes/Twain`
      );
      let curs = true;

      if (token.value)
        token.value.map((entry) => {
          if (entry.type === "separator") {
            curs = false;
            return;
          }
          this.parse(entry);
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
      this.push_instruction(`pop Twain`);
    } else if (token.type === "variable") {
      this.push_instruction([
        `link ${`${this.stacks.slice(-1)[0]}/${token.value}`}`,
        `pop ${token.value}`,
      ]);
    } else if (token.type === "address") this.parse_assignment(token);
  };

  is_not_literal = (type) =>
    !type || ["variable", "opcode", "address"].includes(type);

  parse_assignment = (line, linked) => {
    let tokens = linked || line.type ? line : this.parse_tokens(line);

    let identifier = tokens[0];
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
      this.current_program().dimensions.push({ name: identifier.value });
      this.push_instruction(`chain ${identifier.value}`);
      this.stack_instruction([
        `link ${this.stacks.slice(-1)[0]}`,
        `chain ${identifier.value}`,
        `pop ${identifier.value}`,
        "pop",
      ]);
    }

    let prev_token;
    if (tokens[1] && tokens[1].type === "opcode") {
      this.parse_opcode(tokens.slice(1));
      prev_token = tokens[1];
    } else {
      tokens.slice(1).map((tok) => {
        this.parse(tok);
      });
      prev_token = tokens.slice(-1)[0];
    }

    if (tokens.length > 1) {
      this.push_instruction([
        "cursor {output}",
        `write ${
          this.is_not_literal(prev_token && prev_token.type)
            ? "{metadata.output:-1}"
            : "{datapath:-1}"
        }`,
        `pop ${identifier.value}`,
      ]);
    } else this.push_instruction(`pop ${identifier.value}`);
  };

  current_program = () => {
    return this.program_configs[this.programs_index];
  };

  marker_pattern = /@[a-zA-Z_][a-zA-Z0-9_]*/;

  parse_opcode = (line) => {
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
          this.is_not_literal(tok.type) &&
          !(tok.type === "address" && tok.value.match(this.marker_pattern))
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
    addr = addr.split("/");

    let real_addr = "";

    if (addr[0] === "@") {
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
    markers[name] = this.instruction_index();

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
      line = line.replace(
        this.marker_pattern,
        (revamping && value > 0 ? value - 1 : value).toString()
      );

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

  compile = (codes) => {
    let code_array = codes.split("\n");

    for (let c = 0; c < code_array.length; c++) {
      let line = code_array[c].trim();

      let curr_program = this.current_program();
      this.is_routine = line.startsWith(".") || line.startsWith("@");

      this.handle_codes(line, curr_program);

      if (!line) continue;

      if (line.startsWith(":")) {
        line = this.handle_marker(line);

        if (!line) continue;
      }

      line = this.resolve_offset(line);

      if (line === ";") this.pop();
      else if (this.is_routine) this.parse_routine(line);
      else if (line.startsWith("//")) this.parse_comment(line.slice(2).trim());
      else if (line.startsWith(">@")) this.parse_assignment(line, true);
      else if (line.startsWith(">")) this.parse_assignment(line);
      else this.parse_opcode(line);

      (!curr_program || this.is_routine) &&
        this.handle_codes(line, this.current_program());
    }
  };

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
    this.pure = meta && meta.pure;

    let cb = meta && meta.cb;

    this.compile(codes);

    // console.log(JSON.stringify(this.instructions, null, 2), "hiya");

    this.account.load({
      program: { instructions: [...this.instructions] },
      callback: cb,
    });

    let programs = this.globals.readone({ global: "programs" });
    let codes_global = this.globals.readone({ global: "codes" });
    this.program_configs.map((config) => {
      let program = programs.programs.find(
        (prog) => prog.physical_address === config.physical_address
      );

      let code_str = config.codes.join("\n");
      let code_hash = this.oracle.hash(code_str);
      let code = codes_global.codes.find((cod) => cod.hash === code_hash);
      let code_id = code && code.code_id;
      if (!code_id) {
        code_id = _id("codes");

        this.globals.update(
          { global: "codes" },
          { codes: { $unshift: { code_id, hash: code_hash } } }
        );
      }

      if (program) {
        config._id = program.program_id;
        this.programs_folder.update(config._id, {
          ...config,
          codes: { $unshift: code_id },
        });
      } else {
        this.programs_folder.write({ ...config, codes: [code_id] });
        this.globals.update(
          { global: "programs" },
          {
            programs: {
              $unshift: {
                physical_address: config.physical_address,
                program_id: config._id,
              },
            },
          }
        );
      }
      !code && this.codes_folder.write({ codes: code_str, _id: code_id });
    });
    this.program_configs = [];
    this.instructions = [];
    this.pure = false;
  };
}

export default Loader;
