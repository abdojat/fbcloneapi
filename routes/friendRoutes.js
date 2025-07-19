// /routes/friendRoutes.js

const express = require('express');
const router = express.Router();
const {
    getFriendRequests,
    getFriends,
    getSuggestions,
    getUserFriends,
    handelActions,
    getSentFriendRequests,
} = require('../controllers/friendControllers');
const auth = require('../middlewares/auth');

// /api/friends

router.post('/action',auth,handelActions);
router.get('/requests', auth, getFriendRequests);
router.get('/sentFriendRequests', auth, getSentFriendRequests);
router.get('/', auth, getFriends);
router.get('/suggestions', auth, getSuggestions);
router.get('/:id/friends', auth, getUserFriends);

module.exports = router;