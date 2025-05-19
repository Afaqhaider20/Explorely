const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { createPost, getPost, deletePost, getHomeFeed, getPublicFeed, handleUpvote, handleDownvote } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Create post with optional media
router.post('/', protect, upload.single('media'), createPost);

// Get a post with comments (Public route)
router.get('/:id', getPost);

// Get home feed (Protected route)
router.get('/feed/home', protect, getHomeFeed);

// Get public feed (No auth required)
router.get('/feed/public', getPublicFeed);

// Delete a post (Protected route)
router.delete('/:id', protect, deletePost);

// Voting routes
router.post('/:id/upvote', protect, handleUpvote);
router.post('/:id/downvote', protect, handleDownvote);

module.exports = router;
