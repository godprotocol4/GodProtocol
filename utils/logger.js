const blessed = require('blessed');


// const screen = blessed.screen({
//   smartCSR: true,
//   title:'God Protocol'
// })

class Logger {
  constructor() {
   this.log_boxes= new Array()

//  this.  clock_box = blessed.box({
//     left: 'left',
//     width: '100%',
//     height: 'shrink',
//     content: '',
//     tags: true,
//     border: {
//       type: 'line'
//     },
//     style: {
//       border: {
//         fg: 'cyan'
//       }
//     }
//   })

//   screen.append(this.clock_box)

  }



  log=(data_logger)=> {
    // this.clock_box.setContent(data_logger())
    // this.update_log_box_positions()
  }


  update_log_box_positions() {
    // this.log_boxes.forEach((box, index) => {
    //   box.top = index;
    // });
  
    // this.clock_box.top = this.log_boxes.length;
    // screen.render();
  }

  store_log=(message)=> {
  //   const logBox = blessed.box({
  //     top: this.log_boxes.length,
  //     left: 'left',
  //     width: '100%',
  //     height: 3,
  //     content: message,
  //     tags: true,
  //     border: {
  //       type: 'line'
  //     },
  //     style: {
  //       border: {
  //         fg: 'green'
  //       }
  //     }
  //   });
  
  //   screen.append(logBox);
  //   this.log_boxes.push(logBox);
  //  this. update_log_box_positions();
  //   screen.render();
  // console.log(message)
  }
  
}



export default Logger;