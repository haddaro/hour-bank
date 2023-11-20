const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const factory = require('./handlerFactory');
const log = require('../utils/logger');
const sendEmail = require('../utils/email');

const version = `v1`;
const WEEK = 7 * 24 * 60 * 60 * 1000;

const getSentOrderMessage = (req, order) => {
  const approveUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/${version}/orders/approve/${order._id}`;
  const rejectUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/${version}/orders/reject/${order._id}`;
  const message = `${order.from.name} wants to book an hour of service. ${
    req.body.message ? `Personal message: ${req.body.message}` : ''
  }`;
  return `${message}
  To approve, send a PATCH request to: ${approveUrl}
  To reject, send a PATCH request to ${rejectUrl}`;
};

const filterOrder = (order) => {
  const { _id, orderStatus, from, to, sendDate } = order;
  const filteredFrom = { _id: from._id, name: from.name };
  const filteredTo = { _id: to._id, name: to.name };
  return { _id, sendDate, orderStatus, from: filteredFrom, to: filteredTo };
};

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
exports.updateOrder = factory.updateDocument(Order);
exports.deleteOrder = factory.deleteDocument(Order);

exports.sendOrder = catchAsync(async (req, res, next) => {
  const from = await User.findById(req.user._id);
  const to = await User.findById(req.params.id);
  if (!from || !to)
    return next(new AppError('Could not proceed with the order', 400));
  if (from._id.toString() === to._id.toString())
    return next(new AppError('You cannot send an order to yourself', 400));
  if (from.credit < 1)
    return next(new AppError('Not enough credit to make the order', 400));
  const order = await Order.create({ from, to });
  const message = getSentOrderMessage(req, order);
  await sendEmail(to.email, 'You received an order', message);
  //send response:
  const filteredOrder = filterOrder(order);
  res.status(201).json({ status: 'success', data: { order: filteredOrder } });
});

exports.approveOrder = catchAsync(async (req, res, next) => {
  const to = req.user._id;
  let order = await Order.findById(req.params.id);
  if (
    !order ||
    order.to._id.toString() !== to.toString() ||
    order.orderStatus !== 'pending-approval'
  )
    return next(new AppError(`You cannot approve order`, 401));
  order.orderStatus = 'pending-transaction';
  order.approveDate = Date.now();
  order = await order.save();
  const message = `${
    order.to.name
  } has agreed to sell you an hour of service. ${
    req.body.message ? `Personal message: ${req.body.message}` : ''
  }`;
  await sendEmail(order.from.email, 'Your order was approved', message);
  const filteredOrder = filterOrder(order);
  res.status(200).json({ status: 'success', data: { order: filteredOrder } });
});

exports.rejectOrder = catchAsync(async (req, res, next) => {
  const to = req.user._id;
  let order = await Order.findById(req.params.id);
  if (
    !order ||
    order.to._id.toString() !== to.toString() ||
    order.orderStatus !== 'pending-approval'
  )
    return next(new AppError(`You cannot reject order`, 401));
  order.orderStatus = 'cancelled';
  order.approveDate = Date.now();
  order = await order.save();
  const message = `${order.to.name} cannot sell you an hour of service. ${
    req.body.message ? `Personal message: ${req.body.message}` : ''
  }`;
  await sendEmail(order.from.email, 'Your order cannot be fulfilled', message);
  const filteredOrder = filterOrder(order);
  res.status(200).json({ status: 'success', data: { order: filteredOrder } });
});

exports.makeTransaction = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  const from = await User.findById(req.user._id);
  const to = await User.findById(order.to);

  if (
    !to ||
    order.orderStatus !== 'pending-transaction' ||
    from._id.toString() !== order.from._id.toString()
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
    const filteredOrder = filterOrder(order);
    res.status(200).json({ status: 'success', data: { order: filteredOrder } });
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
