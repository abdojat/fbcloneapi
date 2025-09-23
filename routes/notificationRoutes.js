// /routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead, markSingleAsRead, registerDeviceToken } = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

router.get('/', auth, getNotifications);
router.patch('/mark-all-read', auth, markAllAsRead);
router.patch('/:id/mark-read', auth, markSingleAsRead);

// Register device FCM token for push notifications
router.post('/register-token', auth, registerDeviceToken);

module.exports = router;
