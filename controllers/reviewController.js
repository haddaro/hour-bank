const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.createReview = catchAsync(async (req, res, next) => {
  const author = await User.findById(req.user._id);
  const subject = await User.findById(req.params.id);
  if (!author || !subject)
    return next(new AppError('Cannot submit a review', 400));
  if (!(await author.completedOrderTo(subject._id)))
    return next(
      new AppError('Please complete an order an then write a review', 400),
    );
  if (await author.wroteReviewOn(subject._id))
    return next(
      new AppError(`You already wrote a review on ${subject.name}`, 400),
    );
  req.body.author = author._id;
  req.body.subject = subject._id;
  const review = await Review.create(req.body);
  res.status(201).json({ status: 'success', data: { review } });
});

exports.getReview = factory.getDocument(Review);
exports.getAllReviews = factory.getAllDocuments(Review);
exports.deleteReview = factory.deleteDocument(Review);
