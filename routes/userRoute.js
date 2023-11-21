/* Router for user-related operations.
   Implements routes for sign-up, log-in,
   reset and update password,
   order an hour of service from a user, and CRUD operations.
   Most operations require authentication and some are restricted to admins.
 */

const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const reviewRouter = require('./reviewRoute');

const router = express.Router();
router.use('/:id/reviews', reviewRouter);

router
  .route('/me')
  .get(authController.protect, userController.getMe)
  .patch(
    authController.protect,
    authController.catchInjection,
    userController.updateMe,
  )
  .delete(authController.protect, userController.deactivateMe);

router.post('/signup', authController.catchInjection, authController.signup);

router.post('/login', authController.login);

router.patch(
  '/update-password',
  authController.protect,
  authController.updatePassword,
);

router.post('/forgot-password', authController.forgotPassword);

router.patch('/reset-password/:token', authController.resetPassword);

router.post(
  '/order-hour/:id',
  authController.protect,
  orderController.sendOrder,
);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    userController.updateUser,
  )
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    userController.deleteUser,
  );

router.route('/').get(userController.getAllUsers);

module.exports = router;
