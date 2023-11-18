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
//S C H E M A:
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
      //make it not show up in a query:
      select: false,
    },
    passwordConfirm: {
      type: String,
      //A validator to check if the two passwords on 'save' are the same:
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
    /* -----implement reviews with parent referencing----- */
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

//V I R TU A L S
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

//M I D D L E W A R E S
//Encrypt password each time it is saved
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, WORK_FACTOR).catch((err) => {
    next(new AppError(err.message, 500));
  });
  this.passwordConfirm = undefined;
  //If the password is modified on an existing document, update the time
  //and subtract a second because the jwt might be issued before the save:
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

//Omit inactive users from any query that starts with find:
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

//INSTANCE METHODS
//Compare entered password with the one encrypted in the db:
userSchema.methods.correctPassword = catchAsync(
  async (enteredPassword, savedPassword) =>
    await bcrypt.compare(enteredPassword, savedPassword),
);
//Check time of password change:
//"function" because we need the "this" keyword
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

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + RESET_EXPIRATION_TIME;
  return resetToken;
};

userSchema.methods.CompletedOrderTo = async function (toId) {
  const orders = await Order.find({
    from: this._id,
    orderStatus: 'complete',
  }).select('to -id');
  return orders.some((order) => order.to._id.toString() === toId.toString());
};
userSchema.methods.wroteReviewOn = async function (subjectId) {
  const reviews = await Review.find({
    author: this._id,
  }).select('subject -id');
  return reviews.some(
    (review) => review.subject._id.toString() === subjectId.toString(),
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;
