const express = require('express');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

router
  .route('/')
  .get(bookingsController.getAllBookings)
  .post(bookingsController.createBooking);

router
  .route('/:id')
  .get(bookingsController.getBooking)
  .patch(bookingsController.updateBooking)
  .delete(bookingsController.deleteBooking);

module.exports = router;
