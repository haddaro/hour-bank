const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const sendEmail = require(''); //-------implement------

exports.sendOrder = catchAsync(async (req, res, next) => {
  //Get the "from" from the logged-in user and check if they have credit:
  const from = await User.findById(req.user._id);
  if (from.credit < 1)
    return next(new AppError('Not enough credit to make the order', 400));
  //Get the "to" from req.params.id
  const to = await User.findById(req.params.id);
  if (!from || !to)
    return next(new AppError('Could not proceed with the order', 400));
  //Create an order document:
  const order = await Order.create({ from, to });
  //email the "to" with approval/rejection instructions
  const message =
    req.body.text || `${from.name} wants to order an hour from you.`;
  await sendEmail(to.email, 'send', message);
  //send response:
  res.status(201).jason({ status: 'success', data: order });
});

exports.approveOrder = catchAsync(async (req, res, next) => {
  const loggedUserId = req.user._id;
  let order = await Order.findById(req.params.id);
  if (order?.to !== loggedUserId || order?.orderStatus !== 'pending-approval')
    return next(new AppError(`Cannot approve order`, 401));
  order.orderStatus = 'pending-transaction';
  order.approveDate = Date.now();
  order = await order.save();
  const message =
    req.body.message || `${order.to.name} has approved your order.`;
  await sendEmail(order.to.email, 'approve', message);
  res.status(200).json({ status: 'success', data: order });
});

exports.rejectOrder = catchAsync(async (req, res, next) => {
  const loggedUserId = req.user._id;
  let order = await Order.findById(req.params.id);
  if (order?.to !== loggedUserId || order?.orderStatus !== 'pending-approval')
    return next(new AppError(`Cannot reject order`, 401));
  order.orderStatus = 'canceled';
  order.rejectDate = Date.now();
  order = await order.save();
  const message =
    req.body.message || `${order.to.name} has rejected your order.`;
  await sendEmail(order.to.email, 'approve', message);
  res.status(200).json({ status: 'success', data: order });
});

exports.makeTransaction = catchAsync(async (req, res, next) => {});
