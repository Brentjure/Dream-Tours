const Review = require('../models/reviewModel');
const factoryHandler = require('./handlerFactory');

exports.getAllReviews = factoryHandler.getAll(Review);
exports.getReview = factoryHandler.getOne(Review);
exports.createReview = factoryHandler.createOne(Review);
exports.updateReview = factoryHandler.updateOne(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
