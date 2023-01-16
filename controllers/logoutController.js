const User = require("../model/User");

const handleLogout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content
  const refreshToken = cookies.jwt;

  // 1) find the user data
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return res.sendStatus(204);
  }
  console.log("foundUser document : ", foundUser);

  // 2) Delete the refreshToken in db
  foundUser.refreshToken = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  ); // 요청한 refreshToken을 제외한 refreshToken array를 새로 만들고
  const result = await foundUser.save();
  console.log(
    "feedback after delete from mongodb's document.save() method : ",
    result
  );

  // res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // secure : true - only serves on https // 프러덕션모드에서는 시큐어설정을 해주자
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.sendStatus(204);
};

module.exports = { handleLogout };
