const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateDatabaseFields = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. PLease use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendResponseDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      stack: err.stack,
      message: err.message,
    });
  }

  // B) Rendered website.
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!!!',
    msg: err.message,
  });
};

const sendResponseProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      // a) Operational error; trusted, send message to the client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // b) Programing error or other unknown error. Don't leak error details
    // Log error to the console
    console.log('ERROR', err);

    // Send generic message
    return res.status(err.statusCode).json({
      status: 'Error',
      message: 'Something went wrong',
    });
  }

  // B) RENDERED WEBSITE
  if (err.isOperational) {
    // a) Operational error; trusted, send message to the client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!!!',
      msg: err.message,
    });
  }
  // b) Programing error or other unknown error. Don't leak error details
  // Log error to the console
  console.log('ERROR', err);

  // Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!!!',
    msg: 'Please try again later.',
  });
};

exports.getGlobalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendResponseDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateDatabaseFields(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    console.log(error.isOperational);

    sendResponseProd(error, req, res);
  }
};
