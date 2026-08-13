const express = require('express');
const router = express.Router();
const { login, register, getMe, getUsers, updateUser, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', protect, authorize('admin'), register);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.put('/change-password', protect, changePassword);

module.exports = router;
