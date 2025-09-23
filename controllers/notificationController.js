// /controllers/notificationController.js


const Notification = require('../models/notification');
const User = require('../models/users');
// firebase admin initialisation helper (new file under config/firebaseAdmin.js)
const admin = require('../config/firebaseAdmin');

let io;
exports.initializeNotificationSocket = (socketIoInstance) => {
    io = socketIoInstance;
};

let onlineUsers = new Map();

exports.setOnlineUsersMap = (map) => {
    onlineUsers = map;
};


exports.createNotification = async (recipientId, senderId, type, postId, content) => {

    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        postId,
        content
    });
    
    // Convert recipient ID to string for comparison
    const recipientIdStr = recipientId.toString();
    
    if (io && onlineUsers.has(recipientIdStr)) {
        console.log('🔔 Emitting notification to user:', recipientIdStr);
        console.log('📊 Online users:', Array.from(onlineUsers.keys()));
        
        // Populate sender and postId before emitting
        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'username profilePicture avatar firstName lastName')
            .populate('postId', '_id content author createdAt updatedAt');
            
        console.log('📤 Populated notification:', {
            id: populatedNotification._id,
            type: populatedNotification.type,
            sender: populatedNotification.sender ? populatedNotification.sender.username : 'null',
            recipient: populatedNotification.recipient,
            hasPost: !!populatedNotification.postId,
            postContent: populatedNotification.postId ? populatedNotification.postId.content : 'null'
        });
            
        const socketId = onlineUsers.get(recipientIdStr);
        console.log('🎯 Sending to socket:', socketId);
        io.to(socketId).emit('newNotification', populatedNotification);
    } else {
        console.log('❌ Not emitting notification - User offline or no io:', {
            hasIo: !!io,
            userOnline: onlineUsers.has(recipientIdStr),
            recipientId: recipientIdStr,
            recipientIdOriginal: recipientId,
            onlineUsers: Array.from(onlineUsers.keys())
        });
    }

    // After socket emit attempt, also send push notifications to any registered device tokens
    try {
        // populate if not already populated
        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'username profilePicture avatar firstName lastName')
            .populate('postId', '_id content author createdAt updatedAt');

        await sendPushToUser(recipientId, {
            title: populatedNotification.sender?.username || 'FBClone',
            body: populatedNotification.content || 'You have a new notification',
            data: {
                type,
                postId: postId ? postId.toString() : '',
                notificationId: notification._id.toString(),
                // Include sender identifiers so the mobile app can navigate on tap
                senderId: senderId ? senderId.toString() : (populatedNotification.sender?._id ? populatedNotification.sender._id.toString() : ''),
                userId: senderId ? senderId.toString() : (populatedNotification.sender?._id ? populatedNotification.sender._id.toString() : ''),
                sender: populatedNotification.sender?.username || ''
            }
        });
    } catch (err) {
        console.error('sendPushToUser error:', err);
    }

    return notification;

};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'username')
            .populate('postId', '_id content author createdAt updatedAt');

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark as read' });
    }
};

exports.markSingleAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark as read' });
    }
};

// Register a device token for the authenticated user
exports.registerDeviceToken = async (req, res) => {
    try {
        const token = req.body?.token;
        if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.fcmTokens = Array.from(new Set([...(user.fcmTokens || []), token]));
        await user.save();

        return res.json({ success: true, message: 'Token registered' });
    } catch (e) {
        console.error('registerDeviceToken error', e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper to send FCM messages to a user's tokens and prune invalid tokens
async function sendPushToUser(userId, payload) {
    if (!admin || !admin.messaging) {
        console.warn('Firebase admin not initialized; skipping push');
        return;
    }
    const user = await User.findById(userId).select('fcmTokens');
    const tokens = (user?.fcmTokens || []).filter(Boolean);
    if (!tokens.length) return;

    const message = {
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data || {},
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        if (response.failureCount > 0) {
            const invalidTokens = [];
            response.responses.forEach((r, idx) => {
                if (!r.success) {
                    const code = r.error?.code || '';
                    if (code.includes('invalid-registration-token') || code.includes('registration-token-not-registered') || code.includes('messaging/invalid-registration-token') || code.includes('messaging/registration-token-not-registered')) {
                        invalidTokens.push(tokens[idx]);
                    }
                }
            });
            if (invalidTokens.length) {
                user.fcmTokens = user.fcmTokens.filter(t => !invalidTokens.includes(t));
                await user.save();
            }
        }
        console.log('FCM send result:', { successCount: response.successCount, failureCount: response.failureCount });
    } catch (err) {
        console.error('FCM send error:', err);
    }
}
