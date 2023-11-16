const User = require('../models/userModel');
const factory = require('./handlerFactory');

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
