const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();
router.patch('/approve', authController.protect, orderController.approveOrder);
router.patch('/reject', authController.protect, orderController.rejectOrder);
router.patch(
  '/transact',
  authController.protect,
  orderController.makeTransaction,
);
router.route('/').get(orderController.getAllOrders);
router.route('/:id').get(orderController.getOrder);

module.exports = router;
