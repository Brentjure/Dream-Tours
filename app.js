const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');

const viewsRouter = require('./routes/viewRoute');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const bookingRouter = require('./routes/bookingRoute');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

app.enable('trust proxy');

// View engine: pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
// Implement cors
app.use(cors());
app.options('*', cors());

// Serving static file
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    contentSecurityPolicyHeader: 'Content-Security-Policy',
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        'unsafe-inline',
        'https://unpkg.com/',
        'https://cdnjs.cloudflare.com/',
      ],
      // scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      // scriptSrc: ["'self'", 'https://*.stripe.com'],
      // scriptSrc: ["'self'", 'https://*.mapbox.com'],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      workerSrc: ["'self'", 'data:', 'blob:'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: [
        "'self'",
        'blob:',
        'https://api.mapbox.com',
        'https://*.tiles.mapbox.com',
        'https://events.mapbox.com',
        'https://unpkg.com/',
        'https://cdnjs.cloudflare.com/',
      ],
      //upgradeInsecureRequests: [],
    },
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

// app.post(
//   '/webhook-checkout',
//   express.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );

// Body-parser: reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization aganist NoSQL query injection
app.use(mongoSanitize());

// Data sanitization aganist XSS
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'maxGroupSize',
      'price',
    ],
  })
);

app.use(compression());

// ROUTES
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler.getGlobalError);

module.exports = app;
