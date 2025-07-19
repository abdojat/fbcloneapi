// /routes/chatRoutes.js


const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    sendMessage,
    getMessages,
    getRecentChats,
    markAsRead
} = require('../controllers/chatController');

// /api/chat

router.get('/recent', auth, getRecentChats);
router.post('/', auth, sendMessage);
router.patch('/:messageId/read', auth, markAsRead);
router.get('/:recipientId', auth, getMessages);

module.exports = router;
