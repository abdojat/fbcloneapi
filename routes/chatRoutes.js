// /routes/chatRoutes.js


const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    sendMessage,
    getMessages,
    getRecentChats,
    markAsRead,
    editMessage,
    deleteMessage
} = require('../controllers/chatController');

// /api/chat

router.get('/recent', auth, getRecentChats);
router.post('/', auth, sendMessage);
router.patch('/:messageId/read', auth, markAsRead);
router.patch('/:messageId/edit', auth, editMessage);
router.delete('/:messageId/delete', auth, deleteMessage);
router.get('/:recipientId', auth, getMessages);

module.exports = router;
