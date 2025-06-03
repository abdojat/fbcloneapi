// /models/notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['friendRequest', 'message', 'like', 'comment', 'friendRejected', 'friendAccepted', 'canceled', 'friendRemoved'], required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    content: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    readAt: { type: Date },
});

module.exports = mongoose.model('Notification', notificationSchema);
