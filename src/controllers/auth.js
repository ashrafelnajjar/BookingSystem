const User = require("../models/user");
const AppError = require("../utils/AppError");
const bcrypt = require("bcrypt");
const util = require("util");
const JWT = require("jsonwebtoken");
const jwtSginPromise = util.promisify(JWT.sign);
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const signup = async (req, res, next) => {
  const body = req.body;
  const exist = await User.findOne({ email: body.email });
  if (exist) throw new AppError("this email is already registered !", 402);
  const user = await User.create(body);
  res.status(200).json({ message: "success", user });
};
const login = async (req, res, next) => {
  const body = req.body;
  const user = await User.findOne({ email: body.email }).populate("password");
  if (!user) throw new AppError(" email or password is incorrect!", 400);

  const iscorrectpassword = await bcrypt.compare(body.password, user.password);
  if (!iscorrectpassword)
    throw new AppError("email or password is incorrect!", 400);
  const token = await jwtSginPromise({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.status(200).json({ message: "success", token, user });
};


module.exports = {
  login,
  signup,
};
