const User = require("../model/User");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and Password are required." });

  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ username: user }).exec();
  if (duplicate) return res.sendStatus(409); // Conflict(충돌) // 새로운 사용자등록하려는데, 데이터베이스에 이미 있는 경우는 에러코드를 설정한다.

  try {
    // encrypt the password
    const hashedPwd = await bcrypt.hash(pwd, 10);
    // default is 10. 10 is salt. salt가 10이면 10번 암호화한다는말. 높을수록 암호화를 많이 하게되고 속도가 느려진다.

    // create and store the new user
    const result = await User.create({
      username: user,
      password: hashedPwd,
    });

    // alternate method
    // const newUser = new User({
    //   username: user,
    //   password: hashedPwd,
    // });
    // const altResult = await User.save();

    console.log("result : ", result);

    res.status(201).json({ success: `New user ${user} created.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { handleNewUser };
