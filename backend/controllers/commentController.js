const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        const postId = req.params.postId;

        // Validate the post exists
        const post = await Post.findById(postId).populate('author', '_id');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check nesting level if it's a reply
        if (parentCommentId) {
            const canNest = await Comment.canNestUnder(parentCommentId);
            if (!canNest) {
                return res.status(400).json({
                    message: 'Comments cannot be nested beyond 6 levels'
                });
            }
        }

        const comment = await Comment.create({
            content,
            author: req.user._id,
            post: postId,
            parentComment: parentCommentId || null
        });

        // Add comment to post's comments array
        await Post.findByIdAndUpdate(postId, {
            $push: { comments: comment._id }
        });

        // Only create a POST_COMMENT notification for the post author when it's a top-level comment
        // and when the commenter is not the post author (to prevent self-notifications)
        if (!parentCommentId) {
            const postAuthorId = post.author._id.toString();
            const commenterId = req.user._id.toString();
            
            if (postAuthorId !== commenterId) {
                try {
                    const Notification = require('../models/notificationModel');
                    await Notification.createNotification({
                        recipient: post.author._id,
                        sender: req.user._id,
                        type: 'POST_COMMENT',
                        comment: comment._id,
                        post: postId,
                        isRead: false,
                        isSeen: false
                    });
                } catch (error) {
                    console.error('Error creating post comment notification:', error);
                    // Don't throw the error, just log it
                }
            }
        }

        // Create notification if it's a reply to someone else's comment
        if (parentCommentId) {
            try {
                const parentComment = await Comment.findById(parentCommentId)
                    .populate('author', '_id');
                
                if (parentComment) {
                    const postAuthorId = post.author._id.toString();
                    const parentCommentAuthorId = parentComment.author._id.toString();
                    const commenterId = req.user._id.toString();
                    
                    // Only create notification if:
                    // 1. Parent comment author is not the current user
                    // 2. Parent comment author is not the post author (to avoid duplicate notifications)
                    // 3. Current user is not the post author (to prevent self-notifications at any level)
                    if (parentCommentAuthorId !== commenterId &&
                        parentCommentAuthorId !== postAuthorId &&
                        commenterId !== postAuthorId) {
                        const Notification = require('../models/notificationModel');
                        await Notification.createNotification({
                            recipient: parentComment.author._id,
                            sender: req.user._id,
                            type: 'COMMENT_REPLY',
                            comment: comment._id,
                            post: postId,
                            isRead: false,
                            isSeen: false
                        });
                    }
                }
            } catch (error) {
                console.error('Error creating comment reply notification:', error);
                // Don't throw the error, just log it
            }
        }

        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'username avatar')
            .lean();

        res.status(201).json({
            status: 'success',
            data: { comment: populatedComment }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get comments for a post with nested replies
const getPostComments = async (req, res) => {
    try {
        // Get all comments for the post
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean();

        // Clean up comment data
        const cleanComments = comments.map(comment => {
            const { likes, ...cleanComment } = comment;
            return cleanComment;
        });

        // Helper function to get replies for a comment
        const getReplies = (parentId) => {
            return cleanComments
                .filter(comment => 
                    comment.parentComment && 
                    comment.parentComment.toString() === parentId.toString()
                )
                .map(reply => ({
                    ...reply,
                    replies: reply.level < 6 ? getReplies(reply._id) : [] // Only get replies if level < 6
                }))
                .sort((a, b) => a.createdAt - b.createdAt); // Sort replies by oldest first
        };

        // Organize comments into a tree structure
        const commentTree = cleanComments
            .filter(comment => !comment.parentComment) // Get top-level comments
            .map(comment => ({
                ...comment,
                replies: getReplies(comment._id)
            }));

        res.json({
            status: 'success',
            data: {
                comments: commentTree,
                totalCount: comments.length
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
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await comment.remove();

        res.json({
            status: 'success',
            message: 'Comment deleted'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle like on comment
const toggleLike = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)
            .populate('author', '_id');
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const userId = req.user._id;
        const hasLiked = comment.likes.includes(userId);

        if (hasLiked) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Like
            comment.likes.push(userId);

            // Create notification if it's not a self-like
            if (comment.author._id.toString() !== userId.toString()) {
                const Notification = require('../models/notificationModel');
                await Notification.createNotification({
                    recipient: comment.author._id,
                    sender: userId,
                    type: 'COMMENT_LIKE',
                    comment: comment._id,
                    post: comment.post,
                    isRead: false,
                    isSeen: false
                });
            }
        }

        await comment.save();

        res.json({
            status: 'success',
            data: {
                likeCount: comment.likes.length,
                hasLiked: !hasLiked
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createComment,
    getPostComments,
    deleteComment,
    toggleLike
};
