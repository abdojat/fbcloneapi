// /controllers/friendControllers.js

const User = require('../models/users');
const mongoose = require('mongoose');
const {createNotification}= require('./notificationController')

exports.handelActions = async (req, res) => {
    const { targetUserId, action, requestId } = req.body;
    const userId = req.user._id;
    try {
        const recipient = await User.findById(targetUserId);
        if (!recipient) { return res.status(404).json({ message: 'Recipient not found' }); }
        const sender = await User.findById(userId);

        switch (action) {
            case 'add':
                if (sender.isFriend(targetUserId)) {
                    return res.status(400).json({ message: 'Already friends' });
                }

                if (recipient.hasPendingRequestFrom(userId)) {
                    return res.status(400).json({ message: 'Request already sent' });
                }

                recipient.friendRequests.push({
                    sender: userId,
                    status: 'pending'
                });

                sender.sentFriendRequests.push({
                    recipient: targetUserId,
                    status: 'pending'
                });

                await Promise.all([recipient.save(), sender.save()]);
                await createNotification(
                    targetUserId,
                    userId,
                    'friendRequest',
                    null,
                    null
                );
                return res.status(201).json({ message: 'Friend request sent' });
                break;
            case 'cancel':
                const sentRequest = sender.sentFriendRequests.find(
                    req => req.recipient.equals(targetUserId) && req.status === 'pending'
                );
                if (!sentRequest) {
                    return res.status(404).json({ message: 'No pending sent request to cancel' });
                }
                // Remove from sender's sentFriendRequests
                sender.sentFriendRequests.pull(sentRequest._id);
                await createNotification(
                    targetUserId,
                    userId,
                    'canceled',
                    null,
                    null
                );
                // Find corresponding friendRequest in recipient's friendRequests
                const recvRequest = recipient.friendRequests.find(
                    req => req.sender.equals(userId) && req.status === 'pending'
                );
                if (recvRequest) {
                    recipient.friendRequests.pull(recvRequest._id);
                }

                await Promise.all([sender.save(), recipient.save()]);

                return res.status(200).json({ message: 'Friend request cancelled' });
                break;
            case 'accept':
                const accRequest = sender.friendRequests.id(requestId);
                if (!accRequest) {
                    return res.status(404).json({ message: 'Request not found' });
                }

                const accSentRequest = await recipient.sentFriendRequests.find(req =>
                    req.recipient.equals(userId) && req.status === 'pending'
                );
                sender.friends.push(accRequest.sender);
                recipient.friends.push(userId);

                accRequest.status = 'accepted';
                if (accSentRequest) accSentRequest.status = 'accepted';
                recipient.sentFriendRequests.pull(accSentRequest);
                if (accSentRequest) {
                    sender.friendRequests.pull(accRequest);
                }


                await Promise.all([recipient.save(), sender.save()]);
                await createNotification(
                    recipient._id,
                    userId,
                    'friendAccepted',
                    null,
                    null
                );
                return res.status(200).json({
                    message: `Friend request ${action}ed`,
                    status: accRequest.status
                });
                break;
            case 'reject':
                const rejRequest = sender.friendRequests.id(requestId);
                if (!rejRequest) {
                    return res.status(404).json({ message: 'Request not found' });
                }

                const rejSentRequest = await recipient.sentFriendRequests.find(req =>
                    req.recipient.equals(userId) && req.status === 'pending'
                );

                rejRequest.status = 'accepted';
                if (rejSentRequest) rejSentRequest.status = 'accepted';

                recipient.sentFriendRequests.pull(rejSentRequest);
                if (rejSentRequest) {
                    sender.friendRequests.pull(rejRequest);
                }

                await Promise.all([recipient.save(), sender.save()]);
                await createNotification(
                    recipient._id,
                    userId,
                    'friendRejected',
                    null,
                    null
                );
                return res.status(200).json({
                    message: `Friend request ${action}ed`,
                    status: rejRequest.status
                });
                break;
            case 'remove':
                if (!sender.friends.includes(targetUserId)) {
                    return res.status(400).json({ message: 'User is not in your friends list' });
                }
                await Promise.all([
                    User.findByIdAndUpdate(
                        userId,
                        { $pull: { friends: targetUserId } }
                    ),
                    User.findByIdAndUpdate(
                        targetUserId,
                        { $pull: { friends: userId } }
                    )
                ]);
                await createNotification(
                    targetUserId,
                    userId,
                    'friendRemoved',
                    null,
                    null
                );
                return res.status(200).json({ message: 'Friend removed successfully' });
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFriendRequests = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'friendRequests.sender',
                select: 'username profilePicture'
            })
            .select('friendRequests');

        res.status(200).json(user.friendRequests);
    } catch (error) {
        next(error);
    }
};

exports.getSentFriendRequests = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'sentFriendRequests.recipient',
                select: 'username profilePicture'
            })
            .select('sentFriendRequests');

        res.status(200).json(user.sentFriendRequests);
    } catch (error) {
        next(error);
    }
};

exports.getFriends = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'username profilePicture')
            .select('friends');

        res.status(200).json(user.friends);
    } catch (error) {
        next(error);
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)
            .populate('friends')
            .populate('sentFriendRequests.recipient');

        const friendIds = currentUser.friends.map(f => f._id);
        const pendingRequestIds = currentUser.sentFriendRequests
            .filter(req => req.status === 'pending')
            .map(req => req.recipient._id);

        const suggestions = await User.find({
            _id: {
                $ne: req.user._id,
                $nin: [...friendIds, ...pendingRequestIds]
            }
        })
            .select('username picturePath')
            .limit(10);

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserFriends = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('friends', 'username firstName lastName picturePath');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

