const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) GEt data from the tour collection
  const tours = await Tour.find();

  // 2) Build a template
  // 3) Render that template using data from 1)
  res.status(200).render('overview', {
    title: 'Dream tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  // 2) Build a template
  // 3) Render that template usubg data from 1)
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});