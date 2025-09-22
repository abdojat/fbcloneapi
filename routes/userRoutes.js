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
    updateProfilePicture,
    savePost,
    unsavePost,
    getSavedPosts,
    searchUsers,
    getUserStats,
} = require('../controllers/userControllers.js');
const auth = require('../middlewares/auth.js');
const { parser } = require('../config/cloudinary.js');

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
router.get('/:id/stats', auth, getUserStats);
router.put('/:id', auth, updateUserInfo);
router.post('/profile-picture', auth, parser.single('profilePicture'), updateProfilePicture);
router.post('/save-post/:id', auth, savePost);
router.post('/unsave-post/:id', auth, unsavePost);

module.exports = router;