const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    subject: { type: mongoose.Schema.ObjectId, ref: 'User' },
    author: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } },
);

// A query middleware to populate a review document with its author and subject.
reviewSchema.pre(/^find/, function (next) {
  this.find().populate([
    {
      path: 'subject',
      select: 'name',
    },
    { path: 'author', select: 'name' },
  ]);
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
