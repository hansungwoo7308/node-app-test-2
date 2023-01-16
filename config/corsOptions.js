// const whitelist = [
//   "https://www.yoursite.com",
//   "http://192.168.1.109:5500",
//   "http://localhost:3500",
// ];

const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // allowedOrigins 에 현재 접속한 origin 이 없으면 -1을 리턴한다.
      // in other words,,, allowedOrigins 에 origin 이 있거나, origin 이 undefined(false) 인 경우,
      callback(null, true); // it is allowed...
    } else {
      // allowedOrigins 에 origin 이 없으면,
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
