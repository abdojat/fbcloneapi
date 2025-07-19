// /controllers/notificationController.js


const Notification = require('../models/notification');

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
    if (io && onlineUsers.has(recipientId)) {
        const socketId = onlineUsers.get(recipientId);
        io.to(socketId).emit('newNotification', notification);
    }
    return notification;

};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'username')
            .populate('postId', 'content');

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
