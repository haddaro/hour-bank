const User = require('../models/userModel');
const factory = require('./handlerFactory');

exports.getUser = factory.getDocument(User);
exports.getAllUsers = factory.getAllDocuments(User);
