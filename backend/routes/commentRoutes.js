const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');

const {
    createComment,
    getPostComments,
    deleteComment,
    toggleLike
} = require('../controllers/commentController');

// Base routes
router.post('/post/:postId/comments', protect, createComment);
router.get('/post/:postId/comments', getPostComments);

// Comment actions
router.delete('/comments/:commentId', protect, deleteComment);
router.post('/comments/:commentId/like', protect, toggleLike);

module.exports = router;
