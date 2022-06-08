const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User must have a name'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: [true, 'Email address is required'],
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minLength: [8, 'Password must 8 characters or more'],
      required: [true, 'Password is required'],
      select: false,
    },
    confirmPassword: {
      type: String,
      trim: true,
      required: [true, 'Confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      default: 'user',
      emum: ['user', 'guide', 'lead-guide', 'admin'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INSTANCE METHODS
userSchema.methods.correctPassword = async function (
  CandidatePassword,
  userPassword
) {
  return await bcrypt.compare(CandidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedTimestamp < JWTTimestamp;
  }

  // False means NOT changd his passward
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update('resetToken')
    .digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// DOCUMENT MIDDLEWARE
userSchema.pre('save', async function (next) {
  // 1) Only run this function if password is changed or created
  if (!this.isModified('password')) return next();

  // 2) Hash the password with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // 3) Delete the passwordConfirm field
  this.confirmPassword = undefined;

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// USER MODEL
const User = mongoose.model('User', userSchema);

module.exports = User;
