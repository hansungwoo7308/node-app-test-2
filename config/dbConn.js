/* 16진수 표기법 */
// 30 black / 31 red / 32 green / 33 yellow / 34 blue / 37 white / 0 origin color
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const END = "\x1b[0m";

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // const db = await mongoose.createConnection(process.env.DATABASE_URI, {
    //   useUnifiedTopology: true,
    //   useNewUrlParser: true,
    // });

    // db.on("error", function () {
    //   console.log("failed to mongoDB.");
    //   // console.log("mongoDB connection failed.");
    // });
    // db.once("open", function () {
    //   console.log(`${YELLOW}connected to mongoDB 2.${END}`);
    //   // console.log("mongoDB connection completed.");
    // });

    await mongoose.connect(process.env.DATABASE_URI, {
      dbName: "CompanyDB",
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    // console.log(`${YELLOW}mongoose is connected to mongoDB 2.${END}`);
  } catch (error) {
    console.error(`${RED}error : ${error}${END}`);
  }
};

module.exports = connectDB;
