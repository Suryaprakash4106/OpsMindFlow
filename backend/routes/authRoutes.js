const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes - existing
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// New public routes for multi-step registration
router.post('/send-otp', authController.sendOtp);
router.post('/complete-registration', authController.completeRegistration);

// Protected routes
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);
router.put('/profile', isAuthenticated, authController.updateProfile);
router.put('/change-password', isAuthenticated, authController.changePassword);

module.exports = router;