const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
    createReview, 
    getReviews, 
    searchReviews, 
    getTrendingReviews,
    toggleLike,
    getReview,
    deleteReview,
    getLikeStatus
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const reviewCommentRoutes = require('./reviewCommentRoutes');

// Public routes
router.get('/', getReviews);
router.get('/search', searchReviews);
router.get('/trending', getTrendingReviews);

// Protected routes
router.post('/', protect, upload.array('images', 10), createReview);

// Mount comment routes before parameterized routes
router.use('/:reviewId/comments', reviewCommentRoutes);

// Parameterized routes
router.get('/:id', getReview);
router.post('/:id/like', protect, toggleLike);
router.get('/:id/like-status', protect, getLikeStatus);
router.delete('/:id', protect, deleteReview);

module.exports = router; 