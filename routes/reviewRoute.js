/* Router for order-related CRUD operations.
   Most operations require authentication and some are restricted to admins.
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    reviewController.deleteReview,
  );

router
  .route('/')
  .post(authController.protect, reviewController.createReview)
  .get(reviewController.getAllReviews);

module.exports = router;
