// /models/users.js

const mongoose = require('mongoose');
const Token = require('../models/token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    min: 2,
    max: 50,
  },
  lastName: {
    type: String,
    required: true,
    min: 2,
    max: 50,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  bio: {
    type: String,
    default: "",
  },
  picturePath: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  }],
  sentFriendRequests: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  passwordHistory: [{
    password: String,
    changedAt: Date
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
});


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the new password first
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(this.password, salt);

  // Add to password history (after hashing)
  if (this.passwordHistory.length >= 5) {
    this.passwordHistory.shift();
  }

  this.passwordHistory.push({
    password: hashed,         // ✅ Store hash, not plain text
    changedAt: Date.now()
  });

  // Set the new (hashed) password
  this.password = hashed;

  next();
});


userSchema.methods.hasUsedPassword = async function (newPassword) {
  for (const entry of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, entry.password)) {
      return true;
    }
  }
  return false;
};

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add to your User model
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '1y' }
  );
  return token;
};

userSchema.methods.isFriend = function (userId) {
  return this.friends.some(friendId => friendId.equals(userId));
};

// Add instance method to check for pending requests
userSchema.methods.hasPendingRequestFrom = function (userId) {
  return this.friendRequests.some(request =>
    request.sender.equals(userId) && request.status === 'pending'
  );
};

// Add instance method to check for sent pending requests
userSchema.methods.hasSentPendingRequestTo = function (userId) {
  return this.sentFriendRequests.some(request =>
    request.recipient.equals(userId) && request.status === 'pending'
  );
};

// Add instance method to get sent request by ID
userSchema.methods.getSentRequestById = function (requestId) {
  return this.sentFriendRequests.id(requestId);
};

// Add instance method to remove sent request
userSchema.methods.removeSentRequest = function (requestId) {
  this.sentFriendRequests.pull(requestId);
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
