const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const factoryHandler = require('./handlerFactory');

exports.getAllTours = factoryHandler.getAll(Tour);
exports.getTour = factoryHandler.getOne(Tour, {
  path: 'reviews',
  model: Review,
});
exports.createTour = factoryHandler.createOne(Tour);
exports.updateTour = factoryHandler.updateOne(Tour);
exports.deleteTour = factoryHandler.deleteOne(Tour);
