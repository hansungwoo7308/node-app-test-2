/* 16진수 표기법 */
// 30 black / 31 red / 32 green / 33 yellow / 34 blue / 37 white / 0 origin color
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const END = "\x1b[0m";

require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const { errorHandler } = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");
const PORT = process.env.PORT || 3500;

// Connect to mongoDB
connectDB();

// middleware
app.use(logger);
app.use(credentials); // Handle options credentials check - before CORS! // and fetch cookies credentials requirement
app.use(cors(corsOptions)); // cross origin resource sharing
app.use(express.urlencoded({ extended: false })); // built-in middleware to handle urlencoded form data // it is used to apply middlewares
app.use(express.json()); // built-in middleware for json
app.use(cookieParser()); // middleware for cookie

// serve static files
app.use("/", express.static(path.join(__dirname, "/public")));

// routes
app.use("/", require("./routes/root")); // 홈페이지
app.use("/register", require("./routes/register")); // 가입페이지
app.use("/auth", require("./routes/auth")); // 로그인페이지
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));

app.use(verifyJWT); // routes 라우팅이 위에서 아래로 (waterfall) 실행되기 때문에 verifyJWT는 아래부터 적용한다.
app.use("/employees", require("./routes/api/employees"));

// it is similar to catch...
app.all("*", (req, res) => {
  res.status(404);
  // check that types...
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html")); // custom 404
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

// const db = mongoose.createConnection(PORT);
mongoose.connection.once("open", () => {
  console.log(`${YELLOW}mongoose is connected to MongoDB${END}`);
  app.listen(
    PORT,
    () =>
      console.log(`${YELLOW}mongoDB server is listening on port ${PORT}${END}`)
    // console.log(`${YELLOW}Server running on port ${PORT}${END}`)
  );
});
