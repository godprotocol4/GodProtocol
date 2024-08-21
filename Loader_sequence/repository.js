class Repository {
  constructor(main) {
    this.main = main;
    this.oracle = this.main.account.manager.oracle;
    this.gds = this.oracle.gds;
    this.programs = this.gds.folder("programs");
    this.codes = this.gds.folder("codes");
  }

  add_program = (config) => {
    let codes = config.codes.filter((line) => !!line.trim());
    let code_hash = this.oracle.hash(codes);
    let code_exist = this.codes.readone({ hash: code_hash });

    let code = this.codes.write({
      body: codes,
      hash: code_hash,
      _id: code_exist && code_exist._id,
    });
    config.codes = code._id;

    let program_hash = this.oracle.hash(JSON.stringify(config));
    let program_exist = this.programs.readone({ hash: program_hash });

    this.programs.write({
      ...config,
      hash: program_hash,
      _id: program_exist && program_exist._id,
    });
  };
}

export default Repository;
