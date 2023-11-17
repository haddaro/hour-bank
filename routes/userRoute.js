const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');

const router = express.Router();
//-------implement restrictTo--------
router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser);
router.post('/signup', authController.signup);
router.post('/login', authController.catchInjection, authController.login);
router.post(
  '/order-hour/:id',
  authController.protect,
  orderController.sendOrder,
);

router
  .route('/me')
  .patch(
    authController.protect,
    authController.catchInjection,
    userController.updateMe,
  );

module.exports = router;
