/* 16진수 표기법 */
// 30 black / 31 red / 32 green / 33 yellow / 34 blue / 37 white / 0 origin color
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const END = "\x1b[0m";

const User = require("../model/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  // branch) if the jwt doesn't exist,
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);

  // branch) if the jwt exist,
  const refreshToken = cookies.jwt;

  // 1) clear the cookie, to make a new token in the cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    // secure: true,
  });

  // 2) find the user data in the database
  const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();
  if (!foundUser) {
    // detected refreshToken reuse (refreshToken의 재사용을 감지)
    // client에서 요청한 refreshToken을 디코딩해본다...
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      // database 와 ajax 통신하기 위한 async
      async (err, decoded) => {
        // if the refreshToken is expired, the err is true.
        if (err) return res.sendStatus(403); // Forbidden

        // if the refreshToken is not expired,
        console.log(`${RED}attempted refreshToken reuse!${END}`);

        // find the user in database
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec();

        // save an empty refreshTokenArray in database
        hackedUser.refreshToken = []; // empty array로
        const result = await hackedUser.save(); // 데이터베이스에 저장한다
        console.log("saving empty refreshTokenArray in database...");
        console.log(`result : `, result);
      }
    );
    return res.sendStatus(403);
  }

  // 3) evaluate the refreshToken (유효성 검사)
  // arrange a newRefreshTokenArray
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      // branch) if the refreshToken is expired, so it is invalid.
      if (err) {
        console.log(
          `${RED}request.cookie.refreshToken is expired, so it is invalid.${END}`
        );

        // save the newRefreshTokenArray in database
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
        console.log("saving a newRefreshTokenArray in database...");
        console.log(`result : `, result);
      }
      if (err || foundUser.username !== decoded.username)
        return res.sendStatus(403); // forbidden

      // branch) if the refreshToken is not expired, so it is valid.

      // 1) issue the accessToken and refreshToken
      const roles = Object.values(foundUser.roles);
      const accessToken = jwt.sign(
        { UserInfo: { username: decoded.username, roles: roles } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10s" }
      );

      const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1m" }
      );

      // 2) save a newRefreshTokenArray in database
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      const result = await foundUser.save();
      console.log("saving a newRefreshTokenArray in database...");
      console.log("result : ", result);

      // 3) set the response
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      }); // input value of maxAge is one day.

      res.json({ roles, accessToken, newRefreshToken });
    }
  );
};

module.exports = { handleRefreshToken };
