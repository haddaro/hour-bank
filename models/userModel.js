const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Order = require('./orderModel');
const Review = require('./reviewModel');

const WORK_FACTOR = 12;
const RESET_EXPIRATION_TIME = 10 * 60 * 1000;

const FIELDS = [
  'tech',
  'education',
  'music',
  'healthcare',
  'cooking',
  'babysitting',
  'home-maintenance',
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'please provide name'],
    },
    email: {
      type: String,
      required: [true, 'please provide e-mail'],
      unique: true,
      validate: [validator.isEmail, 'Please provide a valid e-mail'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: function (password) {
        return password === this.password;
      },
      message: 'passwords do not match',
    },
    passwordChangedAt: Date,
    active: { type: Boolean, default: true },
    field: {
      type: [String],
      enum: {
        values: FIELDS,
        message: `Please choose from: ${FIELDS.join(' ')}`,
      },
    },
    subfield: String,
    bio: String,
    city: String,
    remote: Boolean,
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'role is either user or admin',
      },
      default: 'user',
    },
    credit: { type: Number, default: 0 },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } },
);

userSchema.virtual('sentOrders', {
  ref: 'Order',
  foreignField: 'from',
  localField: '_id',
});

userSchema.virtual('receivedOrders', {
  ref: 'Order',
  foreignField: 'to',
  localField: '_id',
});

userSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'subject',
  localField: '_id',
});

//Encrypts password each time it is saved.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, WORK_FACTOR).catch((err) => {
    next(new AppError(err.message, 500));
  });
  this.passwordConfirm = undefined;
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

//Omits deactivated users from queries.
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

//Omits admins from queries.
userSchema.pre(/^find/, function (next) {
  this.find({ role: 'user' });
  next();
});

//Compares entered password with the one encrypted in the db.
userSchema.methods.correctPassword = catchAsync(
  async (enteredPassword, savedPassword) =>
    await bcrypt.compare(enteredPassword, savedPassword),
);

// Checks whether the user's password was changed after the given time.
userSchema.methods.passwordChangedAfter = function (JWTExpiration) {
  if (this.changedPassWordAt) {
    const passwordChange = parseInt(
      this.changedPassWordAt.getTime() / 1000,
      10,
    );
    return passwordChange > JWTExpiration;
  }
  return false;
};

/* Signs a temporary token to allow users who forgot their password
   to reset it
*/
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + RESET_EXPIRATION_TIME;
  return resetToken;
};

/* Checks whether the 'this' user has completed a transaction
   to a specified user.
*/
userSchema.methods.completedOrderTo = async function (toId) {
  const orders = await Order.find({
    from: this._id,
    orderStatus: 'complete',
  }).select('to');
  return orders.some((order) => order.to._id.toString() === toId.toString());
};

/* Checks whether the 'this' user has already written a review
   on a specified user.
*/
userSchema.methods.wroteReviewOn = async function (subjectId) {
  const reviews = await Review.find({
    author: this._id,
  }).select('subject');
  return reviews.some(
    (review) => review.subject._id.toString() === subjectId.toString(),
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;
