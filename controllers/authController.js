const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const log = require('../utils/logger');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const app = require('../app');

const version = process.env.VERSION;

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

exports.catchInjection = catchAsync(async (req, res, next) => {
  if (req.body.role || req.body.credit) {
    const ip = req.connection.remoteAddress;
    await log(`malicious ip: ${ip}`);
    return next(new AppError('Could not proceed', 400));
  }
  next();
});

//Sign-up
exports.signup = catchAsync(async (req, res, next) => {
  //------put catch injection in rout -------/
  const user = await User.create(req.body);
  createAndSendToken(user, 201, res, next);
});

//Log-in:
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please log in with e-mail and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 400));
  createAndSendToken(user, 200, res, next);
});

//Verify that a user is logged-in and find who that is:
exports.protect = catchAsync(async (req, res, next) => {
  //Parse the request's header to get the authorization's bearer token:
  let token;
  if (req.headers.authorization?.startsWith('Bearer'))
    //Then the token is the second 'word' after Bearer:
    token = req.headers.authorization.split(' ')[1];
  if (!token) return next(new AppError('Please sign in', 401));
  //Work with a version of jwt.verify that returns a promise:.
  const verify = promisify(jwt.verify);
  //Check that the token is ours and that it has not expired:
  const decoded = await verify(token, process.env.JWT_SECRET);
  //Check if the user was not deleted after issuing the token:
  const user = await User.findById(decoded.id);
  //Check if the user did not change password after issuing the token:
  if (user.passwordChangedAfter(decoded.exp))
    return next(new AppError('Please sign in again', 401));
  //Write user info on the request:
  req.user = user;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User not found', 404));
  //Generate a reset token:
  const resetToken = user.CreatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/${version}/users/reset-password/${resetToken}`;
  const message = `Forgot your password?
  Please send a PATCH request with a new password
  and an identical passwordConfirm to ${resetURL}
  \nDid not forget your password? Please ignore this email.`;
  try {
    await sendEmail(user.email, 'forgot', message);
  } catch (err) {
    const appError = new AppError('Could not mail token', 500);
    user.PasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }).catch(() => {
      appError.message = appError.message.concat(' and could not delete token');
    });
    return next(appError);
  }
  res.status(200).json({ status: 'success', message: 'Please check e mail' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  createAndSendToken(user, 200, res, next);
});
