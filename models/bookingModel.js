const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    required: [true, 'Paid is required'],
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
