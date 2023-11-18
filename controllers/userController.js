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
    {
      path: 'reviews',
      select: '-subject',
    },
  ],
});
exports.getAllUsers = factory.getAllDocuments(User);
exports.updateUser = factory.updateDocument(User);
exports.deleteUser = factory.deleteDocument(User);

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
  const user = await User.findByIdAndUpdate(req.user._id, req.body);
  res.status(201).json({ status: 'success', data: { user } });
});

exports.deactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(200).json({ status: 'success', data: null });
});
