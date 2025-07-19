const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1y' // Auto-delete after token expiration time
    }
});

module.exports = mongoose.model('Token', tokenSchema);