// /controllers/chatController.js

const Message = require('../models/message');
const User = require('../models/users')
const mongoose = require('mongoose');
const { createNotification } = require('./notificationController');
exports.sendMessage = async (req, res) => {
    try {
        const { sender, recipient, text, timestamp } = req.body;
        const newMessage = await Message.create({
            sender,
            recipient,
            text,
            timestamp,
        });
        createNotification(recipient, sender, 'message', newMessage._id, `${text.substring(0, 50)}`);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const recipient = req.params.recipientId;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, recipient: recipient },
                { sender: recipient, recipient: req.user._id }
            ]
        }).sort('timestamp');

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecentChats = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { recipient: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $addFields: {
                    chatPartner: {
                        $cond: [
                            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            "$recipient",
                            "$sender"
                        ]
                    }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: "$chatPartner",
                    latestMessage: { $first: "$text" },
                    timestamp: { $first: "$timestamp" },
                    partnerId: { $first: "$chatPartner" }
                }
            }
        ]);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    recipient: new mongoose.Types.ObjectId(userId),
                    read: false
                }
            },
            {
                $addFields: {
                    chatPartner: "$sender"
                }
            },
            {
                $group: {
                    _id: "$chatPartner",
                    unreadCount: { $sum: 1 }
                }
            }
        ]);

        const unreadMap = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.unreadCount;
        });

        const userIds = messages.map(m => m.partnerId);
        const users = await User.find({ _id: { $in: userIds } }).select('username');

        const result = messages.map(m => {
            const user = users.find(u => u._id.toString() === m.partnerId.toString());
            return {
                _id: m.partnerId,
                username: user?.username || 'Unknown',
                latestMessage: m.latestMessage,
                timestamp: m.timestamp,
                unreadCount: unreadMap[m.partnerId.toString()] || 0
            };
        });

        // Sort chats from newest to oldest by timestamp
        result.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ data: result });

    } catch (error) {
        res.status(500).json({ message: 'Failed to load recent chats', error: error.message });
    }
};


exports.markAsRead = async (req, res) => {
    const { messageId } = req.params;
    await Message.findByIdAndUpdate(messageId, { read: true });
    res.json({ success: true });
};
