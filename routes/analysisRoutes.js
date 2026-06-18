const express = require('express');
const router = express.Router();

const analysisController = require('../controllers/analysisController');
const chatController = require('../controllers/chatController');

router.post('/analyze-farm', analysisController);
router.post('/chat-advice', chatController);

module.exports = router;