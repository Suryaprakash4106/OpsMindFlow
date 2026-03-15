const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/ask', isAuthenticated, chatController.askQuestion);

module.exports = router;