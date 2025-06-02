// /routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead, markSingleAsRead } = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

router.get('/', auth, getNotifications);
router.patch('/mark-all-read', auth, markAllAsRead);
router.patch('/:id/mark-read', auth, markSingleAsRead);

module.exports = router;
