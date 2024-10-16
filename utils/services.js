const http = require("http");

const post_request = (payload, cb) => {
  // let options = {
  //   hostname: 'example.com',
  //   port: 80,
  //   path: '/api/users',
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Content-Length': Buffer.byteLength(postData),
  //   },
  // };

  let data = typeof payload.data !== 'string' ? JSON.stringify(payload.data) : payload.data
  
  let req = http.request(
    {
      ...payload.options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    },
    (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
        cb && cb(chunk);
      });

      res.on("end", () => {
        cb && cb(data);
        // console.log("Response:", data);
      });
    }
  );

  req.on("error", (e) => {
    cb && cb(e.message);
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);

  req.end();
};

export { post_request };
