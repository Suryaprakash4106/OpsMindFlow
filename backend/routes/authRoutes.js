const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes - existing
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp); // Updated to handle both old and new flows
router.post('/resend-otp', authController.resendOtp);

// New public routes for multi-step registration
router.post('/send-otp', authController.sendOtp);
router.post('/complete-registration', authController.completeRegistration);

// Protected routes
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);

module.exports = router;