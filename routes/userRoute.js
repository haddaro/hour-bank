const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const reviewRouter = require('./reviewRoute.js');

const router = express.Router();

router
  .route('/me')
  .get(authController.protect, userController.getMe)
  .patch(
    authController.protect,
    authController.catchInjection,
    userController.updateMe,
  )
  .delete(authController.protect, userController.deactivateMe);
router.route('/').get(userController.getAllUsers);
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
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
