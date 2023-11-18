const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');

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

//-------implement restrictTo--------
router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
router.post('/signup', authController.signup);
router.post('/login', authController.catchInjection, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.forgotPassword);
router.post(
  '/order-hour/:id',
  authController.protect,
  orderController.sendOrder,
);

module.exports = router;
