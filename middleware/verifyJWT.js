const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log("verifyJWT  req.headers.authorization.bearer : ", authHeader); // Bearer Token

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("verifyJWT  You have to send bearerToken...");
    return res.sendStatus(401);
  }
  console.log("verifyJWT  req.headers.authorization.bearer : ", authHeader); // Bearer Token
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // res.json({ message: "this is invalid token..." });
      res.sendStatus(403); // invalid token
    }
    req.user = decoded.UserInfo.username;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
