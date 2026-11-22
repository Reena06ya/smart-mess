const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  loginAdmin,
  loginUser,
  createAdminAccount,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public Authentication
router.post('/register', registerStudent);
router.post('/login', loginUser);
router.post('/student-login', loginStudent);
router.post('/admin-login', loginAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin-Only creation of new admin accounts
router.post('/create-admin', protect, authorizeRoles('admin'), createAdminAccount);

module.exports = router;
