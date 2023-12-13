const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const { Op } = require("sequelize");

// signup user and signing the token using jwt and passing in the cookie
exports.userSignup = async (request, response, next) => {
  try {
    const { name, email, phonenumber, imageUrl, password } = request.body;
    let userExist = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phonenumber }],
      },
    });
    if (!userExist) {
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phonenumber,
        imageUrl,
        password: hash,
      });
      const token = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: "1h",
      });
      response.cookie("token", token, { maxAge: 3600000 });
      return response
        .status(201)
        .json({ message: "user Account created successfully" });
    } else {
      return response
        .status(409)
        .json({ message: "Email or Phone Number already exist!" });
    }
  } catch (error) {
    console.log(error);
  }
};


// signin user and signing the token using jwt and passing the token in the cookie
exports.userSignin = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    let userExist = await User.findOne({ where: { email } });
    if (userExist) {
      const isPasswordValid = await bcrypt.compare(
        password,
        userExist.password
      );
      if (isPasswordValid) {
        const token = jwt.sign({ userId: userExist.id }, secretKey, {
          expiresIn: "1h",
        });
        response.cookie("token", token, { maxAge: 3600000 });
        return response
          .status(201)
          .json({ message: "Username and password correct" });
      } else {
        return response.status(401).json({ message: "Invalid Password!" });
      }
    } else {
      return response.status(409).json({ message: "Account is not exist!" });
    }
  } catch (error) {
    console.log(error);
  }
};
