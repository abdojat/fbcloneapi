// /controllers/userControllers.js

const User = require('../models/users.js');
const Post = require('../models/posts');
const Token = require('../models/token');

exports.registerUser = async (req, res, next) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            firstName,
            lastName,
            username,
            email,
            password,
        });

        await user.save();

        const token = user.generateAuthToken();

        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username
        };

        res.json({ user: userResponse, token });
    } catch (error) {
        res.send(error);
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = user.generateAuthToken();

        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username
        };

        res.json({ user: userResponse, token });

    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');

        await Token.create({ token });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -__v -passwordHistory');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserPicture = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('picturePath');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ picturePath: user.picturePath });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUserInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        delete updates.password;
        delete updates.friends;
        delete updates.createdAt;

        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).select('-password -__v');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user._id;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { picturePath: req.file.path },
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.savePost = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { savedPosts: req.params.id } },
            { new: true }
        ).populate('savedPosts');

        res.json({ success: true, data: user.savedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save post' });
    }
};


exports.unsavePost = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { savedPosts: req.params.id } },
            { new: true }
        ).populate('savedPosts');

        res.json({ success: true, data: user.savedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to unsave post' });
    }
};

exports.getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'savedPosts',
            populate: { path: 'author', select: 'username profilePicture' }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, data: user.savedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch saved posts', error: error.message });
    }
};


exports.searchUsers = async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ message: 'Query is required' });

    try {
        const users = await User.find({
            username: { $regex: q, $options: 'i' }
        }).select('_id username picturePath');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Count posts by user
        const Post = require('../models/posts');
        const postCount = await Post.countDocuments({ author: userId });

        // Count friends
        const friendCount = user.friends.length;

        // Count likes received on user's posts
        const posts = await Post.find({ author: userId });
        const likesReceived = posts.reduce((total, post) => total + post.likes.length, 0);

        res.status(200).json({
            postCount,
            friendCount,
            likesReceived
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
