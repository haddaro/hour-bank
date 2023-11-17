const User = require('../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const log = require('../utils/logger');

exports.getUser = factory.getDocument({
  Model: User,
  populateOptions: [
    {
      path: 'sentOrders',
      select: '-from',
    },
    {
      path: 'receivedOrders',
      select: '-to',
    },
  ],
});
exports.getAllUsers = factory.getAllDocuments(User);

exports.updateUser = factory.updateDocument(User);

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password)
    return next(
      new AppError(
        'Password can only be changed through change password route',
        401,
      ),
    );
  const user = User.findByIdAndUpdate(req.body);
  res(201).json({ status: 'success', data: { user } });
});
