const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.createReview = catchAsync(async (req, res, next) => {
  // Business rule: Users can only review if they have completed an order with the subject.
  // This check ensures reviews are based on actual transactions.
  const author = await User.findById(req.user._id);
  const subject = await User.findById(req.params.id);
  if (!author || !subject)
    return next(new AppError('Cannot submit a review', 400));

  // Prevent duplicate reviews: a user should not review the same subject more than once.
  if (!(await author.completedOrderTo(subject._id)))
    return next(
      new AppError('Please complete an order an then write a review', 400),
    );
  if (await author.wroteReviewOn(subject._id))
    return next(
      new AppError(`You already wrote a review on ${subject.name}`, 400),
    );

  // Assign the author and subject to the review being created.
  // This links the review clearly to both the reviewer and the subject of the review.
  req.body.author = author._id;
  req.body.subject = subject._id;

  // Create and store the new review in the database.
  const review = await Review.create(req.body);

  // Respond with the newly created review.
  res.status(201).json({ status: 'success', data: { review } });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const user = User.findById(req.user);
  const review = Review.findById(req.params.id);
  if (user._id.toString() !== review.author._id.toString())
    return next(
      new AppError('You cannot update a review that you did not write', 401),
    );
  if (req.body.text) review.text = req.body.text;
  if (req.body.rating) review.rating = req.body.rating;
  await review.save();
});

exports.getReview = factory.getDocument(Review);
exports.getAllReviews = factory.getAllDocuments(Review);
exports.deleteReview = factory.deleteDocument(Review);
