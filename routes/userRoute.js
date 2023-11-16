const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.route('/').get(userController.getAllUsers);
router.route('/:id').get(userController.getUser);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/orderHour', authController.protect, orderController.sendOrder);

module.exports = router;
