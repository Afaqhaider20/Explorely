const Post = require('../models/postModel');
const Community = require('../models/communityModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// Helper function to format post response
const formatPostResponse = (post, userId) => {
    if (!post) return null;
    
    // Convert mongoose document to plain object if needed
    const postObj = post.toObject ? post.toObject() : post;
    
    // Use the stored voteCount instead of calculating
    const formattedPost = {
        ...postObj,
        voteCount: post.voteCount
    };
    
    // Remove unnecessary vote-related fields
    delete formattedPost.votes;
    delete formattedPost.upvotes;
    delete formattedPost.downvotes;
    
    return formattedPost;
};

// Create a post
const createPost = async (req, res) => {
    try {
        const { title, content, communityId } = req.body;

        // Add debug logging
        console.log('Request body:', req.body);
        console.log('Community ID:', communityId);

        // Validate required fields
        if (!title || !content || !communityId) {
            return res.status(400).json({
                message: 'Please provide title, content and communityId',
                received: { title, content, communityId }
            });
        }

        // Check if community exists and user is a member
        const community = await Community.findById(communityId);
        console.log('Found community:', community); // Debug log

        if (!community) {
            return res.status(404).json({ 
                message: 'Community not found',
                providedId: communityId
            });
        }

        if (!community.members.includes(req.user._id)) {
            return res.status(403).json({ 
                message: 'You must be a member of the community to post' 
            });
        }

        // Upload media if provided
        let mediaUrl = null;
        if (req.file) {
            mediaUrl = await uploadToCloudinary(req.file, 'explorely/posts');
        }

        // Create post with initialized votes
        const post = await Post.create({
            title,
            content,
            author: req.user._id,
            community: communityId,
            media: mediaUrl,
            votes: {
                upvotes: [],
                downvotes: []
            }
        });

        // Add post to community
        await Community.findByIdAndUpdate(communityId, {
            $push: { posts: post._id }
        });

        // Get populated post
        const populatedPost = await Post.findById(post._id)
            .select('title content media votes comments createdAt updatedAt') // Add media to selection
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .lean();


        res.status(201).json({
            status: 'success',
            data: { post: populatedPost }
        });
    } catch (error) {
        console.error('Create post error:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .select('title content media voteCount createdAt updatedAt') // Changed to select voteCount instead of votes
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const commentCount = await Comment.countDocuments({ post: post._id });

        const formattedPost = {
            ...post,
            commentCount,
            comments: undefined
        };

        res.json({
            status: 'success',
            data: { post: formattedPost }
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get home feed posts
const getHomeFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get user's joined communities
        const user = await User.findById(req.user._id).select('joinedCommunities');
        
        if (!user.joinedCommunities.length) {
            return res.json({
                posts: [],
                page,
                limit,
                hasMore: false,
                message: 'Join some communities to see posts in your feed'
            });
        }

        // Get posts from joined communities
        const posts = await Post.find({ community: { $in: user.joinedCommunities } })
            .select('title content media voteCount createdAt updatedAt')
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .sort({ voteCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add comment count to each post
        const postsWithCommentCount = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount
            };
        }));

        // Get total count for pagination
        const totalPosts = await Post.countDocuments({
            community: { $in: user.joinedCommunities }
        });

        res.json({
            posts: postsWithCommentCount,
            page,
            limit,
            hasMore: totalPosts > skip + posts.length,
            total: totalPosts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get public feed posts
const getPublicFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find posts in public communities
        const posts = await Post.aggregate([
            // Join with communities to filter private ones
            {
                $lookup: {
                    from: 'communities',
                    localField: 'community',
                    foreignField: '_id',
                    as: 'communityInfo'
                }
            },
            // Filter out private communities
            {
                $match: {
                    'communityInfo.isPrivate': { $ne: true }
                }
            },
            // Sort by vote count and creation date
            { $sort: { voteCount: -1, createdAt: -1 } },
            // Pagination
            { $skip: skip },
            { $limit: limit },
            // Lookup author details
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorDetails'
                }
            },
            // Format the post object
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    media: 1,
                    voteCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    author: {
                        _id: { $arrayElemAt: ["$authorDetails._id", 0] },
                        username: { $arrayElemAt: ["$authorDetails.username", 0] },
                        avatar: { $arrayElemAt: ["$authorDetails.avatar", 0] }
                    },
                    community: {
                        _id: { $arrayElemAt: ["$communityInfo._id", 0] },
                        name: { $arrayElemAt: ["$communityInfo.name", 0] }
                    }
                }
            }
        ]);

        // Add comment count to each post
        const postsWithCommentCount = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount
            };
        }));

        // Get total count for pagination
        const totalPosts = await Post.countDocuments({});

        res.json({
            posts: postsWithCommentCount,
            page,
            limit,
            hasMore: totalPosts > skip + posts.length,
            total: totalPosts
        });
    } catch (error) {
        console.error('Public feed error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is post author or admin
        if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete all comments associated with the post
        await Comment.deleteMany({ post: post._id });

        // Remove post from community's posts array
        await Community.findByIdAndUpdate(post.community, {
            $pull: { posts: post._id }
        });

        // Delete the post
        await post.remove();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Handle upvote
const handleUpvote = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        // Find and update in one operation
        const post = await Post.findOneAndUpdate(
            { _id: postId },
            [
                {
                    $set: {
                        votes: {
                            upvotes: {
                                $cond: [
                                    { $in: [userId, "$votes.upvotes"] },
                                    { $setDifference: ["$votes.upvotes", [userId]] },
                                    { $concatArrays: ["$votes.upvotes", [userId]] }
                                ]
                            },
                            downvotes: {
                                $setDifference: ["$votes.downvotes", [userId]]
                            }
                        },
                        voteCount: {
                            $subtract: [
                                { $size: { $concatArrays: ["$votes.upvotes", [userId]] } },
                                { $size: "$votes.downvotes" }
                            ]
                        }
                    }
                }
            ],
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ 
            status: 'success',
            voteCount: post.voteCount
        });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Handle downvote
const handleDownvote = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        // Find and update in one operation
        const post = await Post.findOneAndUpdate(
            { _id: postId },
            [
                {
                    $set: {
                        votes: {
                            downvotes: {
                                $cond: [
                                    { $in: [userId, "$votes.downvotes"] },
                                    { $setDifference: ["$votes.downvotes", [userId]] },
                                    { $concatArrays: ["$votes.downvotes", [userId]] }
                                ]
                            },
                            upvotes: {
                                $setDifference: ["$votes.upvotes", [userId]]
                            }
                        },
                        voteCount: {
                            $subtract: [
                                { $size: "$votes.upvotes" },
                                { $size: { $concatArrays: ["$votes.downvotes", [userId]] } }
                            ]
                        }
                    }
                }
            ],
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ 
            status: 'success',
            voteCount: post.voteCount
        });
    } catch (error) {
        console.error('Downvote error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPost,
    getPost,
    deletePost,
    getHomeFeed,
    getPublicFeed,
    handleUpvote,
    handleDownvote
};
