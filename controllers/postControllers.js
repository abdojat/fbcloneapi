// /controllers/postControllers.js

const Post = require('../models/posts');
const User = require('../models/users');
const { createNotification } = require('./notificationController')

exports.createPost = async (req, res) => {
    try {
        if (!req.body?.content?.trim()) {
            return res.status(400).json({
                success: false,
                field: 'content',
                message: 'Post content cannot be empty'
            });
        }

        const post = await Post.create({
            content: req.body.content.trim(),
            author: req.user._id,
            imageUrls: req.body.imageUrls || []
        });


        const populatedPost = await Post.populate(post, {
            path: 'author',
            select: 'username profilePicture'
        });

        res.status(201).json({
            success: true,
            data: populatedPost
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const { content, imageUrls } = req.body;

        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, author: req.user._id },
            { content, imageUrls, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('author', 'username email');

        if (!post) {
            return res.status(404).json({
                message: 'Post not found or you are not authorized to update it'
            });
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            author: req.user._id
        });

        if (!post) {
            return res.status(404).json({
                message: 'Post not found or you are not authorized to delete it'
            });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.likePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { likes: req.user._id } },
            { new: true }
        ).populate('author', 'username');
        if (post.author._id.toString() !== req.user._id.toString()) {
            await createNotification(
                post.author._id,
                req.user._id,
                'like',
                post._id,
                null
            );
        }
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.unlikePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $pull: { likes: req.user._id } },
            { new: true }
        ).populate('author', 'username');

        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        text: req.body.text,
                        author: req.user._id,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        )
            .populate('author', 'username profilePicture')
            .populate('comments.author', 'username profilePicture');
        if (post.author._id.toString() !== req.user._id.toString()) {
            await createNotification(
                post.author._id,
                req.user._id,
                'comment',
                post._id,
                req.body.text.substring(0, 50)
            );
        }

        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profilePicture')
            .populate('comments');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getFriendsPosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('friends');
        const posts = await Post.find({
            author: { $in: user.friends }
        })
            .sort({ createdAt: -1 })
            .populate('author', 'username profilePicture')
            .populate('likes', 'username profilePicture')
            .populate('comments.author', 'username profilePicture')
            .lean(); // Convert to plain JavaScript object

        // Optional: Add pagination
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 10;
        // const startIndex = (page - 1) * limit;
        // const paginatedPosts = posts.slice(startIndex, startIndex + limit);

        res.status(200).json({
            success: true,
            count: posts.length,
            // page,
            // limit,
            // totalPages: Math.ceil(posts.length / limit),
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.id })
            .sort({ createdAt: -1 })
            .populate('author', 'username picturePath')
            .populate('comments.author', 'username picturePath');

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .populate('author', 'username profilePicture')
            .populate('likes', 'username profilePicture')
            .populate('comments.author', 'username profilePicture')
            .lean();
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
