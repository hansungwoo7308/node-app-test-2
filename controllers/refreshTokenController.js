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
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }); // 항상 새로운 토큰으로 설정하기 위해 클리어 해준다

  // 1) find the user data in the database
  const foundUser = await User.findOne({ refreshToken: refreshToken }).exec();

  // detected refreshToken reuse (refreshToken의 재사용을 감지)
  if (!foundUser) {
    // refreshToken을 디코딩해본다...
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      // database 와 ajax 통신하기 위한 async
      async (err, decoded) => {
        // refreshToken이 만료되었으면 err가 true가 된다.
        if (err) return res.sendStatus(403); // Forbidden

        // 클라이언트가 보낸 refreshToken의 decoded를 데이터베이스에서 일치하는 정보가 있는지를 찾는다.
        // 만약 존재하면 해킹당한 상태...
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec();
        hackedUser.refreshToken = []; // empty array로
        const result = await hackedUser.save(); // 데이터베이스에 저장한다
        console.log(result);
      }
    );
    return res.sendStatus(403);
  }

  // 2) make a new refreshToken Array (새롭게 갱신할 리프레시토큰...)
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  ); // 요청한 refreshToken을 제외한 refreshToken array를 새로 만들고

  // 3) evaluate jwt (유효성 검사 - 토큰이 만료되면 에러를 리턴하고, 유효하면 디코딩된 유저데이터를 리턴한다)
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      // refreshToken was invalid
      if (err) {
        // 토큰이 만료됐으면, expired refreshToken을 filtering한 newRefreshTokenArray으로 데이터베이스에 저장한다
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
        // console.log("expired refreshToken : ", result);
        console.log(`${RED}refreshToken is expired${END}`);
        console.log(`CompanyDB.users.foundUser : `, result);
      }
      if (err || foundUser.username !== decoded.username)
        return res.sendStatus(403);

      // refreshToken was still valid
      const roles = Object.values(foundUser.roles);

      // 3) issue the jwt
      const accessToken = jwt.sign(
        { UserInfo: { username: decoded.username, roles: roles } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );

      const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      // 4) save the newRefreshToken
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      const result = await foundUser.save();

      // 5) set the response
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: "None",
        // secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      }); // input value of maxAge is one day.

      res.json({ roles, accessToken });
    }
  );
};

module.exports = { handleRefreshToken };
