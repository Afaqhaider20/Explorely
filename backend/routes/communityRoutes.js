const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
    createCommunity, 
    getCommunity, 
    getCommunityPosts, 
    joinCommunity, 
    leaveCommunity,
    toggleMembership
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// Create community with optional avatar
router.post('/', protect, upload.single('avatar'), createCommunity);

// Get community details
router.get('/:id', getCommunity);

// Get community posts
router.get('/:id/posts', getCommunityPosts);

// Add toggle membership route
router.post('/:id/toggle-membership', protect, toggleMembership);

// Keep the old routes for backward compatibility, but they could be deprecated in the future
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;
