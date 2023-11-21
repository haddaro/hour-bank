/* A controller for authentication and authorization.
   Handles signing-up, logging-in, user-verification and password operations.
   Exceptions are caught in the wrapper catchAsync function,
   that leads to the global error-handling middleware.
 */

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const log = require('../utils/logger');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const version = 'v1';

//Create a JWT and send to the user via cookie:
/* Signs a JWT token and sends it to the client via cookie,
   ensuring security against cross-site scripting and the use of
   https in production.
*/
const createAndSendToken = (user, statusCode, res, next) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10),
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

/* Catches request bodies that try to modify sensitive data,
   and logs the sender's ip to a blacklist file.
*/
exports.catchInjection = catchAsync(async (req, res, next) => {
  if (req.body.role || req.body.credit) {
    const ip = req.connection.remoteAddress;
    await log(`malicious ip: ${ip}`);
    return next(new AppError('Could not proceed', 400));
  }
  next();
});

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  createAndSendToken(user, 201, res, next);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please log in with e-mail and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 400));
  createAndSendToken(user, 200, res, next);
});

/* Verifies that the sender of the request is a logged-in user,
   and saves the user on the request object for the next middlewares.
   Ensures that the user's password has not been changed since issuing the JWT.
*/
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  if (!token) return next(new AppError('Please sign in', 401));
  const verify = promisify(jwt.verify);
  const decoded = await verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (user.passwordChangedAfter(decoded.exp))
    return next(new AppError('Please sign in again', 401));
  req.user = user;
  next();
});

exports.restrictToAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin')
    return next(new AppError('You are not authorized', 401));
  next();
});

/* The first step of a password-reset: issues a temporary token with which 
   the user can reset their password. An e-mail with further instructions
   is sent to the user. In this function, exceptions are also handled independently
   of the global error-handler.
*/
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User not found', 404));
  //Generate a reset token:
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/${version}/users/reset-password/${resetToken}`;
  const message = `Forgot your password?
  Please send a PATCH request with a new password
  and an identical passwordConfirm to ${resetURL}
  \nDid not forget your password? Please ignore this email.`;
  try {
    await sendEmail(user.email, 'Forgot your password?', message);
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

/* The second step of a password-reset: the temporary JWT is verified
   and the password is taken from the body and updated in the db.
*/
exports.resetPassword = catchAsync(async (req, res, next) => {
  const encryptedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gte: Date.now() },
  });
  if (!user)
    return next(new AppError('User not found or reset token expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createAndSendToken(user, 200, res, next);
});

/* Allows logged-in users who know their current password to update it.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!currentPassword || !password || !passwordConfirm)
    return next(
      new AppError(
        'Please specify currentPassword, password, and passwordConfirm',
        400,
      ),
    );
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('Incorrect current password', 400));
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  createAndSendToken(user, 200, res, next);
});
