class Fee {
  constructor(chain){
    this.chain = chain;

    this.fees = new Object()
  }

  set = ({purpose, fee, validator})=>{
    let fees= this.fees[purpose]
    if (!fees){
      fees = new Array();
      this.fees[purpose] = fees;
    }
    fees.push({fee, validator})
  }

  get = (purpose)=>{
    let fees = this.fees[purpose]
    if (!fees)return

    return fees.slice(-1)[0]
  }
}

// Fee is a physical_address
// Validator is also a physical_address
// If fee address is a callable/executable
// validator runs itself using the result from the address using the payload as argument 0
// Else if fee is a datastructure,
// validator runs itself using data as argument.
// Validator must return a true, to pass.

// A chain can have multiple price purposes.