const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    title: {
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

reviewSchema.pre(/^find/, function (next) {
  this.find().populate([
    {
      path: 'subject',
      select: 'name',
    },
    { path: 'author', select: 'name' },
  ]);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
