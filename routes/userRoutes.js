// /routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logout,
    getMe,
    changePassword,
    getUserById,
    getUserPicture,
    updateUserInfo,
    savePost,
    unsavePost,
    getSavedPosts,
    searchUsers,
} = require('../controllers/userControllers.js');
const auth = require('../middlewares/auth.js');

// /api/users

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);
router.get('/saved-posts', auth, getSavedPosts);
router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUserById);
router.get('/:id/picture', getUserPicture);
router.put('/:id', auth, updateUserInfo);
router.post('/save-post/:id', auth, savePost);
router.post('/unsave-post/:id', auth, unsavePost);

module.exports = router;