const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
    createComment,
    getComments,
    deleteComment,
    toggleLike
} = require('../controllers/reviewCommentController');

// Public routes
router.get('/', getComments);

// Protected routes
router.post('/', protect, createComment);
router.delete('/:commentId', protect, deleteComment);
router.post('/:commentId/like', protect, toggleLike);

module.exports = router; 