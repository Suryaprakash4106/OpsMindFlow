const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middleware/auth');

// Handle OPTIONS preflight for /ask route
router.options('/ask', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://opsmindflow.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID, X-User-ID');
  res.sendStatus(200);
});

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