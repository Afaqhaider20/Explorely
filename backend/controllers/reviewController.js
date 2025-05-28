const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const ReviewComment = require('../models/reviewCommentModel');
const Notification = require('../models/notificationModel');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const mongoose = require('mongoose');

// Helper function to format review response
const formatReviewResponse = (review) => {
    if (!review) return null;
    
    // Convert mongoose document to plain object if needed
    const reviewObj = review.toObject ? review.toObject() : review;
    
    // Remove unnecessary fields
    delete reviewObj.likes;
    
    return reviewObj;
};

// Create a review
const createReview = async (req, res) => {
    try {
        const { title, content, location, category, rating, userCity, userCountry } = req.body;

        // Validate required fields
        if (!title || !content || !location || !category || !rating) {
            return res.status(400).json({
                message: 'Please provide all required fields',
                received: { title, content, location, category, rating }
            });
        }

        // Upload images if provided
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(file => uploadToCloudinary(file, 'explorely/reviews'))
            );
        }

        // Create review
        const review = await Review.create({
            title,
            content,
            location,
            category,
            rating,
            author: req.user._id,
            images: imageUrls,
            likes: [],
            userCity,
            userCountry
        });

        // Get populated review
        const populatedReview = await Review.findById(review._id)
            .populate('author', 'username avatar')
            .lean();

        res.status(201).json({
            status: 'success',
            data: { review: formatReviewResponse(populatedReview) }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get reviews with pagination and filters
const getReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const sort = req.query.sort || 'recent'; // recent, popular, rating

        // Build query
        const query = {};
        if (category && category !== 'all') {
            query.category = category;
        }

        // Build sort options
        let sortOptions = {};
        switch (sort) {
            case 'popular':
                sortOptions = { likeCount: -1, createdAt: -1 };
                break;
            case 'rating':
                sortOptions = { rating: -1, createdAt: -1 };
                break;
            default: // recent
                sortOptions = { createdAt: -1 };
        }

        // Execute query with pagination
        const reviews = await Review.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username avatar')
            .lean();

        // For each review, fetch the latest top-level comment count
        const reviewsWithCommentCount = await Promise.all(reviews.map(async (review) => {
            const commentCount = await ReviewComment.countDocuments({ review: review._id, parentComment: null });
            return { ...formatReviewResponse(review), commentCount };
        }));

        // Get total count for pagination
        const total = await Review.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                reviews: reviewsWithCommentCount,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Search reviews
const searchReviews = async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Build search query
        const searchQuery = {
            $text: { $search: q }
        };

        // Execute search with pagination
        const reviews = await Review.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username avatar')
            .lean();

        // Get total count for pagination
        const total = await Review.countDocuments(searchQuery);

        res.json({
            status: 'success',
            data: {
                reviews: reviews.map(formatReviewResponse),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Search reviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get trending reviews (most popular today)
const getTrendingReviews = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reviews = await Review.find({
            createdAt: { $gte: today }
        })
        .sort({ likeCount: -1 })
        .limit(limit)
        .populate('author', 'username avatar')
        .lean();

        res.json({
            status: 'success',
            data: {
                reviews: reviews.map(formatReviewResponse)
            }
        });
    } catch (error) {
        console.error('Get trending reviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Like/Unlike a review
const toggleLike = async (req, res) => {
    try {
        // Validate review ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid review ID' 
            });
        }

        // Find review and populate author
        const review = await Review.findById(req.params.id).populate('author', '_id');
        if (!review) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Review not found' 
            });
        }

        // Check if user has already liked the review
        const hasLiked = review.likes.some(likeId => likeId.toString() === req.user._id.toString());
        
        if (hasLiked) {
            // Unlike the review
            review.likes = review.likes.filter(likeId => likeId.toString() !== req.user._id.toString());
        } else {
            // Like the review
            review.likes.push(req.user._id);
            
            // Create notification for review author if not self
            if (review.author._id.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: review.author._id,
                    sender: req.user._id,
                    type: 'REVIEW_LIKE',
                    review: review._id,
                    isRead: false,
                    isSeen: false
                });
            }
        }

        // Save the review
        await review.save();

        // Return updated review data
        res.json({
            status: 'success',
            data: {
                review: formatReviewResponse(review),
                hasLiked: !hasLiked
            }
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to update like status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get a single review
const getReview = async (req, res) => {
    try {
        // Validate review ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Review not found' 
            });
        }

        const review = await Review.findById(req.params.id)
            .populate('author', 'username avatar')
            .lean();

        if (!review) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Review not found' 
            });
        }

        // Fetch the latest top-level comment count
        const commentCount = await ReviewComment.countDocuments({ review: review._id, parentComment: null });
        
        res.json({
            status: 'success',
            data: { review: { ...formatReviewResponse(review), commentCount } }
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to fetch review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the user is the author of the review
        if (review.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        // Delete the review
        await review.deleteOne();

        res.json({
            status: 'success',
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get like status for a review
const getLikeStatus = async (req, res) => {
    try {
        // Validate review ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid review ID' });
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user has liked the review
        const hasLiked = review.likes.some(likeId => likeId.toString() === req.user._id.toString());

        res.json({
            status: 'success',
            data: { hasLiked }
        });
    } catch (error) {
        console.error('Get like status error:', error);
        res.status(500).json({ 
            message: 'Failed to get like status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createReview,
    getReviews,
    searchReviews,
    getTrendingReviews,
    toggleLike,
    getReview,
    deleteReview,
    getLikeStatus
}; 