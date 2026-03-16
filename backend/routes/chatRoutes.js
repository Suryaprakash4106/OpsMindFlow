const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middleware/auth');

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Chat routes are working!',
    timestamp: new Date().toISOString(),
    auth: req.headers['x-session-id'] ? 'Headers present' : 'No headers'
  });
});

// Main chat endpoint for asking questions
router.post('/ask', isAuthenticated, chatController.askQuestion);

module.exports = router;