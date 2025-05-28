const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');
const travelKeywords = require('../travelKeywords');

// Create post with optional media
router.post('/', protect, upload.single('media'), postController.createPost);

// Get travel keywords
router.get('/keywords', (req, res) => {
    res.json({ keywords: travelKeywords });
});

// Get a post with comments (Public route)
router.get('/:id', postController.getPost);

// Get home feed (Protected route)
router.get('/feed/home', protect, postController.getHomeFeed);

// Get public feed (No auth required)
router.get('/feed/public', postController.getPublicFeed);

// Delete a post (Protected route)
router.delete('/:id', protect, postController.deletePost);

// Vote routes
router.get('/:id/vote-status', protect, postController.getVoteStatus);
router.post('/:id/upvote', protect, postController.handleUpvote);
router.post('/:id/downvote', protect, postController.handleDownvote);

module.exports = router;
