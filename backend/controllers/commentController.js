const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        const postId = req.params.postId;

        // Validate the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check nesting level if it's a reply
        if (parentCommentId) {
            const canNest = await Comment.canNestUnder(parentCommentId);
            if (!canNest) {
                return res.status(400).json({
                    message: 'Comments cannot be nested beyond 3 levels'
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
                    replies: reply.level < 3 ? getReplies(reply._id) : [] // Only get replies if level < 3
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
        const comment = await Comment.findById(req.params.commentId);
        
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
