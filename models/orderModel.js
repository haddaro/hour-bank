const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Order must come from a user'],
  },
  to: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Order must be addressed to a user'],
  },
  orderStatus: {
    type: String,
    enum: ['pending-approval', 'pending-transaction', 'complete', 'canceled'],
    default: 'pending-approval',
  },
  sendDate: { type: Date, default: Date.now() },
  approveDate: Date,
  rejectDate: Date,
  transactionDate: Date,
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
