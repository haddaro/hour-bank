const User = require('../models/userModel');
const factory = require('./handlerFactory');

exports.getUser = factory.getDocument({ Model: User });
exports.getAllUsers = factory.getAllDocuments(User);
