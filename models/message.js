// /models/message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: { type: String },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);