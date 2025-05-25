// /routes/postRoutes.js

const express = require('express');
const router = express.Router();
const {
    createPost,
    getPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    getFriendsPosts,
    getUserPosts,
    getAllPosts,
} = require('../controllers/postControllers');
const auth = require('../middlewares/auth');

// /api/posts

router.post('/', auth, createPost);
router.get('/', auth, getAllPosts);
router.put('/:id', auth, updatePost); // *
router.delete('/:id', auth, deletePost); //*
router.post('/:id/like', auth, likePost);
router.post('/:id/unlike', auth, unlikePost);
router.post('/:id/comments', auth, addComment);
router.get('/post/:id', getPost); // *
router.get('/friends/feed', auth, getFriendsPosts);
router.get('/user/:id', auth, getUserPosts);


module.exports = router;