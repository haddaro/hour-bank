const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const log = require('../utils/logger');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

//Create a JWT and send to the user via cookie:
const createAndSendToken = (user, statusCode, res, next) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10),
    ),
    //Secure against cross-site scripting:
    httpOnly: true,
  };
  //Make sure that in production we run on https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //Delete the password from the object sent in response (without saving to the db):
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

//Sign-up
exports.signup = catchAsync(async (req, res, next) => {
  //Catch criminals:
  if (req.body.role || req.body.credit) {
    const ip = req.connection.remoteAddress;
    await log(`malicious ip: ${ip}`);
    return next(new AppError('Could not sign up', 400));
  }
  const user = await User.create(req.body);
  //Log user in:
  createAndSendToken(user, 201, res, next);
});

//Log-in:
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please log in with e-mail and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('User not found', 400));
  if (!(await user.correctPassword(password, user.password)))
    return next(new AppError('Check out the forgot-my-password route', 400));
  createAndSendToken(user, 201, res, next);
});
