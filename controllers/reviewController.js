/* A controller for review-related operations.
   Handles CRUD operations for users and admins.
   Exceptions are caught in the wrapper catchAsync function,
   that leads to the global error-handling middleware.
 */
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

/* Allows only users who have completed a transaction with another user,
   to post a review on that user, and only once.
*/
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

// Allows the author of a review to update the review
exports.updateReview = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const review = await Review.findById(req.params.id);
  if (user._id.toString() !== review.author._id.toString())
    return next(
      new AppError('You cannot update a review that you did not write', 401),
    );
  if (req.body.text) review.text = req.body.text;
  if (req.body.rating) review.rating = req.body.rating;
  await review.save();
  res.status(200).json({ status: 'success', data: { review } });
});

// CRUD operations, using factory functions.
exports.getReview = factory.getDocument(Review);
exports.getAllReviews = factory.getAllDocuments(Review);
exports.deleteReview = factory.deleteDocument(Review);
