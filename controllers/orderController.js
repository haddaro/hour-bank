const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const factory = require('./handlerFactory');
const log = require('../utils/logger');

const WEEK = 7 * 24 * 60 * 60 * 1000;

const sendEmail = (to, what, message) => {
  console.log(`will send a '${what}' email to ${to} saying: ${message}`);
}; //-------implement------

exports.getOrder = factory.getDocument({
  Model: Order,
  populateOptions: [
    {
      path: 'from',
      select: 'name email',
    },
    {
      path: 'to',
      select: 'name email',
    },
  ],
});
exports.getAllOrders = factory.getAllDocuments(Order);

exports.sendOrder = catchAsync(async (req, res, next) => {
  const from = await User.findById(req.user._id);
  const to = await User.findById(req.params.id);
  if (!from || !to)
    return next(new AppError('Could not proceed with the order', 400));
  if (from.credit < 1)
    return next(new AppError('Not enough credit to make the order', 400));
  const order = await Order.create({ from, to });
  //email the "to" with approval/rejection instructions
  const message =
    req.body.text || `${from.name} wants to book an hour of service.`;
  await sendEmail(to.email, 'send', message);
  //send response:
  res.status(201).json({ status: 'success', data: order });
});

exports.approveOrder = catchAsync(async (req, res, next) => {
  const loggedUserId = req.user._id;
  let order = await Order.findById(req.params.id);
  if (
    !order ||
    order.to.toString() !== loggedUserId.toString() ||
    order.orderStatus !== 'pending-approval'
  )
    return next(new AppError(`You cannot approve order`, 401));
  order.orderStatus = 'pending-transaction';
  order.approveDate = Date.now();
  order = await order.save();
  const message =
    req.body.message ||
    `${order.to.name} has agreed to sell you an hour of service.`;
  await sendEmail(order.to.email, 'approve', message);
  res.status(200).json({ status: 'success', data: order });
});

exports.rejectOrder = catchAsync(async (req, res, next) => {
  const loggedUserId = req.user._id;
  let order = await Order.findById(req.params.id);
  if (
    !order ||
    order.to.toString() !== loggedUserId.toString() ||
    order.orderStatus !== 'pending-approval'
  )
    return next(new AppError(`You cannot reject this order`, 401));
  order.orderStatus = 'canceled';
  order.rejectDate = Date.now();
  order = await order.save();
  const message =
    req.body.message ||
    `${order.to.name} cannot sell you an hour for the time being.`;
  await sendEmail(order.to.email, 'reject', message);
  res.status(200).json({ status: 'success', data: order });
});

exports.makeTransaction = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  const from = await User.findById(req.user._id);
  const to = await User.findById(order.to);
  if (
    !to ||
    order.orderStatus !== 'pending-transaction' ||
    from._id.toString() !== order.from.toString()
  )
    return next(new AppError('Cannot make transaction'), 400);
  if (order?.approveDate.getTime() > Date.now() + WEEK) {
    order.approveDate = undefined;
    order.orderStatus = 'canceled';
    await order.save();
    return next(new AppError('The approval for this order has expired'), 400);
  }
  //Make the ACID transaction:
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.updateOne(
      { _id: from._id },
      { $inc: { credit: -1 } },
      { session },
    );
    await User.updateOne({ _id: to._id }, { $inc: { credit: 1 } }, { session });
    await Order.updateOne(
      { _id: order._id },
      { $set: { orderStatus: 'complete' } },
      { session },
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    const now = Date.now();
    await log(
      `${now.toString()}: Transaction for order number ${
        order._id
      } aborted \nerror: ${err} `,
    );
  } finally {
    session.endSession();
  }
});
