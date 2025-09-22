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
