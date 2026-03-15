const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Existing admin routes
router.get('/employees', isAuthenticated, isAdmin, adminController.getAllEmployees);
router.post('/employees', isAuthenticated, isAdmin, adminController.addEmployee);
router.delete('/employees/:id', isAuthenticated, isAdmin, adminController.removeEmployee);
router.get('/stats', isAuthenticated, isAdmin, adminController.getStats);

// NEW ROUTES for enhanced admin dashboard
// Get all users (including employees and admins) with details
router.get('/users', isAuthenticated, isAdmin, adminController.getAllUsers);

// Get single user details by ID (for modal)
router.get('/users/:id', isAuthenticated, isAdmin, adminController.getUserDetails);

// Block/unblock a user
router.patch('/users/:id/block', isAuthenticated, isAdmin, adminController.blockUser);
router.patch('/users/:id/unblock', isAuthenticated, isAdmin, adminController.unblockUser);

// Get login statistics for graph and totals
router.get('/login-stats', isAuthenticated, isAdmin, adminController.getLoginStats);

module.exports = router;