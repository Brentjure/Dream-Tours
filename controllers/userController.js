const User = require('../models/userModel');
const factoryHandler = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUsers = factoryHandler.getAll(User);
exports.getUser = factoryHandler.getOne(User);
exports.createUser = factoryHandler.createOne(User);
exports.updateUser = factoryHandler.updateOne(User);
exports.deleteUser = factoryHandler.deleteOne(User);
