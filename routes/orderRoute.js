/* Router for order-related operations.
   Implements routes for managing orders including approving, rejecting,
   making transactions, and CRUD operations.
   All operations require authentication and some are restricted to admins.
 */

const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.patch(
  '/approve/:id',
  authController.protect,
  orderController.approveOrder,
);

router.patch(
  '/reject/:id',
  authController.protect,
  orderController.rejectOrder,
);

router.patch(
  '/transact/:id',
  authController.protect,
  orderController.makeTransaction,
);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictToAdmin,
    orderController.getAllOrders,
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictToAdmin,
    orderController.getOrder,
  )
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    orderController.updateOrder,
  )
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    orderController.deleteOrder,
  );

module.exports = router;
