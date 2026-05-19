const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.post('/session', chatController.createSession);
router.post('/send', chatController.sendMessage);
// Legacy endpoint kept for older tests and clients.
// router.post('/message', chatController.sendMessage);
router.post('/message', chatController.saveMessage);
router.get('/history/:sessionId', chatController.getChatHistory);
router.post('/read/:sessionId', chatController.markRead);

module.exports = router;
