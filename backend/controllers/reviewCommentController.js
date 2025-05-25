const ReviewComment = require('../models/reviewCommentModel');
const Review = require('../models/reviewModel');
const Notification = require('../models/notificationModel');

// Create a comment
const createComment = async (req, res) => {
    try {
        const { content, parentComment } = req.body;
        const reviewId = req.params.reviewId;

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Create comment
        const comment = await ReviewComment.create({
            content,
            author: req.user._id,
            review: reviewId,
            parentComment: parentComment || null
        });

        // Notify review author if not self and top-level comment
        if (!parentComment && review.author.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: review.author,
                sender: req.user._id,
                type: 'REVIEW_COMMENT',
                review: reviewId,
                reviewComment: comment._id,
                isRead: false,
                isSeen: false
            });
        }

        // Get populated comment
        const populatedComment = await ReviewComment.findById(comment._id)
            .populate('author', 'username avatar')
            .lean();

        res.status(201).json({
            status: 'success',
            data: { comment: populatedComment }
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get comments for a review
const getComments = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Get comments with pagination
        const comments = await ReviewComment.find({ review: reviewId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username avatar')
            .lean();

        // Get total count for pagination
        const total = await ReviewComment.countDocuments({ review: reviewId });

        res.json({
            status: 'success',
            data: {
                comments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const comment = await ReviewComment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the author
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.deleteOne();

        res.json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle like on a comment
const toggleLike = async (req, res) => {
    try {
        const comment = await ReviewComment.findById(req.params.commentId).populate('author', '_id');
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const likeIndex = comment.likes.indexOf(req.user._id);
        let hasLiked;
        if (likeIndex === -1) {
            // Like the comment
            comment.likes.push(req.user._id);
            hasLiked = true;
            // Notify comment author if not self
            if (comment.author._id.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: comment.author._id,
                    sender: req.user._id,
                    type: 'REVIEW_COMMENT_LIKE',
                    review: comment.review,
                    reviewComment: comment._id,
                    isRead: false,
                    isSeen: false
                });
            }
        } else {
            // Unlike the comment
            comment.likes.splice(likeIndex, 1);
            hasLiked = false;
        }
        await comment.save();
        res.json({
            status: 'success',
            data: {
                hasLiked,
                likeCount: comment.likes.length
            }
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment,
    toggleLike
}; 