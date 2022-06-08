const Bookings = require('../models/bookingModel');
const factoryHandler = require('./handlerFactory');

exports.getAllBookings = factoryHandler.getAll(Bookings);
exports.getBooking = factoryHandler.getOne(Bookings);
exports.createBooking = factoryHandler.createOne(Bookings);
exports.updateBooking = factoryHandler.updateOne(Bookings);
exports.deleteBooking = factoryHandler.deleteOne(Bookings);
