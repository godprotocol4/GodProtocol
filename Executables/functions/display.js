const display = (args, vm, options) => {
  let { data } = args;

  // console.log(args, 'display.args')
  if (!Array.isArray(data)) data = [data];


  if (options.metadata && options.metadata.raw){
    return vm.display(vm.static_value(data[0]))
  }

  let val = new Array(data.length),
    d = 0;

  for (d = 0; d < data.length; d++) {
    let dat = data[d];

    if(!dat){continue}
    if (dat.static_value) {
      val[d] = dat.static_value;
    } else if (dat.__print__) {
      vm.exec({
        executable: dat.__print__,
        metadata: { index: d },
        location: (result, metadata) => {
          if (result.__print__) {
            result = vm.static_value(result, true);
            if (!result) {
              this.stderr({
                name: "Type_error",
                message: `class.__print__ must return one of type boolean | string | number | twain | array | void`,
              });
            }
          }
          val[metadata.index] = result;

          if (val.filter((v) => !!v).length === data.length) {
            vm.display(val)
          }
        },
      });
    } else {
      val[d] = JSON.stringify(dat);
    }
  }

  if (val.filter((v) => !!v).length === data.length) {
    vm.display(val)
  }

  if (options.metadata && options.metadata.raw)
    return JSON.parse(val[0])
};

export { display };
