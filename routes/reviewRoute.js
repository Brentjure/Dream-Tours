const express = require('express');
const reviewConroller = require('../controllers/reviewController');

const router = express.Router();

router
  .route('/')
  .get(reviewConroller.getAllReviews)
  .post(reviewConroller.createReview);

router
  .route('/:id')
  .get(reviewConroller.getReview)
  .patch(reviewConroller.updateReview)
  .delete(reviewConroller.deleteReview);

module.exports = router;
