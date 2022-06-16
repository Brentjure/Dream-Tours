const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() * 24 * 60 * 60 * 1000 +
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove the password field from user doc
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the email and password exists
  if (!req.body.email && !req.body.password)
    return next(new AppError('Enter your email and password', 400));

  // 2) Check if the user exists and the password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user && !user.correctPassword(password, user.password))
    return next(new AppError('Incorrect email or password', 403));

  // 3) if so, send a token to the client
  createSendToken(user, 200, req, res);

  next();
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  // Login; send a token to the client
  createSendToken(newUser, 200, req, res);

  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token)
    return next(
      new AppError('Your are not logged in. Please login to get access', 401)
    );

  // 2) Verify the token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  console.log(decoded);

  // 3) Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token nolonger exists', 404)
    );

  // 4) Check if user changed password after token was created
  if (currentUser.passwordChangedAfter(decoded.iat))
    return next(
      new AppError('User recently changed password. Please login again', 403)
    );

  // GRANT THE USER ACCESS TO THE PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages. There will be no errors
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1) Verify the token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET_KEY
    );
    console.log(decoded);

    // 2) Check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    // 3) Check if user changed password after token was created
    if (currentUser.passwordChangedAfter(decoded.iat)) return next();

    // THERE IS A LOGGED IN USER
    res.locals.user = currentUser;
    return next();
  }
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You donot have permission to perform this action', 403)
      );

    // Grant access
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email.
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email address', 404));

  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  console.log({ resetToken });
  console.log({ hashed: user.passwordResetToken });

  // 3) Send the token to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email successfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 401)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');
  console.log({ resetToken: req.params.resetToken });
  console.log({ hashedToken });

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gte: Date.now() },
  });
  console.log(user);

  // 2) If the token has not expired and there is a user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 401));

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // 3) Update the password, changed passwordAt property for the user
  // 4) Log the user in; send JWT
  createSendToken(user, 200, req, res, next);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the posted password is correct
  if (!user.correctPasword(req.body.password, user.password))
    return next(new AppError('Your current password is wrong', 401));

  // 3) If so, update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.save();

  // 4) Log user in; send JWT
  createSendToken(user, 200, req, res);
});
