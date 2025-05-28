const Post = require('../models/postModel');
const Community = require('../models/communityModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const mongoose = require('mongoose');

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
        const { title, content, communityId, tags } = req.body;

        // Validate required fields
        if (!title || !content || !communityId) {
            return res.status(400).json({
                message: 'Please provide title, content and communityId',
                received: { title, content, communityId }
            });
        }

        // Check if community exists and user is a member
        const community = await Community.findById(communityId).populate('members', '_id');

        if (!community) {
            return res.status(404).json({ 
                message: 'Community not found',
                providedId: communityId
            });
        }

        // Check if user is a member by comparing ObjectIds
        const isMember = community.members.some(
            member => member._id.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ 
                message: 'You must be a member of the community to post' 
            });
        }

        // Upload media if provided
        let mediaUrl = null;
        if (req.file) {
            mediaUrl = await uploadToCloudinary(req.file, 'explorely/posts');
        }

        // --- TAGS FIX START ---
        let parsedTags = [];
        if (Array.isArray(tags)) {
            parsedTags = tags.filter(tag => typeof tag === 'string' && tag.trim() !== '');
        } else if (typeof tags === 'string') {
            try {
                const temp = JSON.parse(tags);
                if (Array.isArray(temp)) {
                    parsedTags = temp.filter(tag => typeof tag === 'string' && tag.trim() !== '');
                } else if (typeof temp === 'string' && temp.trim() !== '') {
                    parsedTags = [temp];
                }
            } catch (e) {
                // fallback: treat as comma-separated string
                parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        // --- TAGS FIX END ---

        // Create post with initialized votes
        const post = await Post.create({
            title,
            content,
            author: req.user._id,
            community: communityId,
            media: mediaUrl,
            tags: parsedTags,
            votes: {
                upvotes: [],
                downvotes: []
            }
        });

        // Add post to community
        await Community.findByIdAndUpdate(communityId, {
            $push: { posts: post._id }
        });

        // Create notifications for all community members except the post author
        const Notification = require('../models/notificationModel');
        const notificationPromises = community.members
            .filter(member => member._id.toString() !== req.user._id.toString())
            .map(member => 
                Notification.create({
                    recipient: member._id,
                    sender: req.user._id,
                    type: 'COMMUNITY_POST',
                    post: post._id,
                    community: communityId,
                    isRead: false,
                    isSeen: false
                })
            );

        await Promise.all(notificationPromises);

        // Get populated post
        const populatedPost = await Post.findById(post._id)
            .select('title content media votes comments createdAt updatedAt')
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .lean();

        res.status(201).json({
            status: 'success',
            data: { post: populatedPost }
        });
    } catch (error) {
        console.error('Create post error:', error);
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
        const sort = req.query.sort || 'top'; // Default to 'top' if not specified

        // Get user's joined communities
        const user = await User.findById(req.user._id).select('joinedCommunities');
        
        // Define sort options
        const sortOptions = {
            top: { voteCount: -1, createdAt: -1 },
            latest: { createdAt: -1 }
        };

        const currentSort = sortOptions[sort] || sortOptions.top;
        
        if (!user.joinedCommunities.length) {
            // If user hasn't joined any communities, show top posts from all communities
            const posts = await Post.find()
                .select('title content media voteCount createdAt updatedAt')
                .populate('author', 'username avatar')
                .populate('community', 'name')
                .sort(currentSort)
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

            const totalPosts = await Post.countDocuments();

            return res.json({
                posts: postsWithCommentCount,
                page,
                limit,
                hasMore: totalPosts > skip + posts.length,
                total: totalPosts,
                message: 'Showing top posts from all communities'
            });
        }

        // Get total count of posts from joined communities
        const joinedCommunitiesPostCount = await Post.countDocuments({
            community: { $in: user.joinedCommunities }
        });

        let posts = [];
        let hasMore = false;
        let message;

        // If we're still within the range of joined communities' posts
        if (skip < joinedCommunitiesPostCount) {
            // Get posts from joined communities
            posts = await Post.find({ 
                community: { $in: user.joinedCommunities }
            })
            .select('title content media voteCount createdAt updatedAt')
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .sort(currentSort)
            .skip(skip)
            .limit(limit)
            .lean();

            // If we got less posts than the limit, we need to fetch from other communities
            if (posts.length < limit) {
                const remainingLimit = limit - posts.length;
                
                // Keep track of post IDs we've already fetched
                const fetchedPostIds = new Set(posts.map(post => post._id.toString()));
                
                // First, get user's recommendation keywords
                const user = await User.findById(req.user._id).select('recommendationKeywords');
                const userKeywords = user.recommendationKeywords || [];

                // If user has recommendation keywords, first try to get posts with matching tags
                let otherCommunitiesPosts = [];
                if (userKeywords.length > 0) {
                    // Find posts from other communities that have matching tags
                    otherCommunitiesPosts = await Post.find({
                        community: { $nin: user.joinedCommunities },
                        tags: { $in: userKeywords },
                        _id: { $nin: Array.from(fetchedPostIds) }
                    })
                    .select('title content media voteCount createdAt updatedAt')
                    .populate('author', 'username avatar')
                    .populate('community', 'name')
                    .sort(currentSort)
                    .limit(remainingLimit)
                    .lean();

                    // Update fetched post IDs
                    otherCommunitiesPosts.forEach(post => fetchedPostIds.add(post._id.toString()));
                }

                // If we still need more posts, get remaining posts from other communities
                if (otherCommunitiesPosts.length < remainingLimit) {
                    const additionalLimit = remainingLimit - otherCommunitiesPosts.length;
                    const additionalPosts = await Post.find({
                        community: { $nin: user.joinedCommunities },
                        _id: { $nin: Array.from(fetchedPostIds) }
                    })
                    .select('title content media voteCount createdAt updatedAt')
                    .populate('author', 'username avatar')
                    .populate('community', 'name')
                    .sort(currentSort)
                    .limit(additionalLimit)
                    .lean();

                    otherCommunitiesPosts = [...otherCommunitiesPosts, ...additionalPosts];
                }

                posts = [...posts, ...otherCommunitiesPosts];
                message = 'Showing posts from your communities and recommended posts from other communities';
            }
            
            // Calculate hasMore based on whether we've shown all joined communities' posts
            hasMore = skip + posts.length < joinedCommunitiesPostCount;
        } else {
            // We've exhausted joined communities' posts, show posts from other communities
            const otherCommunitiesSkip = skip - joinedCommunitiesPostCount;
            
            // Get posts from other communities
            posts = await Post.find({ 
                community: { $nin: user.joinedCommunities }
            })
            .select('title content media voteCount createdAt updatedAt')
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .sort(currentSort)
            .skip(otherCommunitiesSkip)
            .limit(limit)
            .lean();

            // Get total count of posts from other communities for pagination
            const otherCommunitiesPostCount = await Post.countDocuments({
                community: { $nin: user.joinedCommunities }
            });

            // Calculate hasMore based on other communities' posts
            hasMore = otherCommunitiesSkip + posts.length < otherCommunitiesPostCount;
            message = 'Showing top posts from other communities';
        }

        // Add comment count to each post
        const postsWithCommentCount = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount
            };
        }));

        // Calculate total posts (joined communities + other communities)
        const totalPosts = joinedCommunitiesPostCount + await Post.countDocuments({
            community: { $nin: user.joinedCommunities }
        });

        res.json({
            posts: postsWithCommentCount,
            page,
            limit,
            hasMore,
            total: totalPosts,
            message
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

        // Check if user is post author first
        const isAuthor = post.author.toString() === req.user._id.toString();
        
        // If not author, check community permissions
        if (!isAuthor) {
            const community = await Community.findById(post.community);
            if (!community) {
                return res.status(403).json({ message: 'Not authorized to delete this post' });
            }

            const isOwner = community.creator.toString() === req.user._id.toString();
            const isModerator = community.moderators.some(mod => mod.toString() === req.user._id.toString());

            if (!isOwner && !isModerator) {
                return res.status(403).json({ message: 'Not authorized to delete this post' });
            }
        }

        // Delete all comments associated with the post
        await Comment.deleteMany({ post: post._id });

        // Try to remove post from community's posts array if community exists
        try {
            await Community.findByIdAndUpdate(post.community, {
                $pull: { posts: post._id }
            });
        } catch (error) {
            console.log('Community not found or already deleted, continuing with post deletion');
        }

        // Delete the post using deleteOne
        await Post.deleteOne({ _id: post._id });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get vote status for a post
const getVoteStatus = async (req, res) => {
    try {
        // Validate post ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid post ID' 
            });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Post not found' 
            });
        }

        // Check if user has upvoted or downvoted
        const isUpvoted = post.votes.upvotes.some(id => id.toString() === req.user._id.toString());
        const isDownvoted = post.votes.downvotes.some(id => id.toString() === req.user._id.toString());

        res.json({
            status: 'success',
            data: { 
                isUpvoted,
                isDownvoted,
                voteCount: post.voteCount
            }
        });
    } catch (error) {
        console.error('Get vote status error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to get vote status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Handle upvote
const handleUpvote = async (req, res) => {
    try {
        // Validate post ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid post ID' 
            });
        }

        const post = await Post.findById(req.params.id).populate('author', '_id');
        if (!post) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Post not found' 
            });
        }

        const userId = req.user._id;
        const isUpvoted = post.votes.upvotes.some(id => id.toString() === userId.toString());
        const isDownvoted = post.votes.downvotes.some(id => id.toString() === userId.toString());

        if (isUpvoted) {
            // Remove upvote
            post.votes.upvotes = post.votes.upvotes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add upvote and remove downvote if exists
            post.votes.upvotes.push(userId);
            if (isDownvoted) {
                post.votes.downvotes = post.votes.downvotes.filter(id => id.toString() !== userId.toString());
            }

            // Add post tags to user's recommendation keywords if they exist
            if (post.tags && post.tags.length > 0) {
                const user = await User.findById(userId);
                if (user) {
                    // Filter out tags that are already in user's recommendation keywords
                    const newTags = post.tags.filter(tag => !user.recommendationKeywords.includes(tag));
                    
                    // Add new tags to user's recommendation keywords
                    if (newTags.length > 0) {
                        // Calculate how many items we need to remove from the end
                        const totalLength = user.recommendationKeywords.length + newTags.length;
                        const itemsToRemove = Math.max(0, totalLength - 20);
                        
                        // Remove items from the end if needed
                        const updatedKeywords = user.recommendationKeywords.slice(0, -itemsToRemove);
                        
                        // Add new tags at the beginning
                        user.recommendationKeywords = [...newTags, ...updatedKeywords];
                        await user.save();
                    }
                }
            }

            // Create notification if it's not a self-upvote
            if (post.author._id.toString() !== userId.toString()) {
                const Notification = require('../models/notificationModel');
                await Notification.create({
                    recipient: post.author._id,
                    sender: userId,
                    type: 'POST_LIKE',
                    post: post._id,
                    isRead: false,
                    isSeen: false
                });
            }
        }

        await post.save();

        res.json({
            status: 'success',
            data: {
                isUpvoted: !isUpvoted,
                isDownvoted: false,
                voteCount: post.voteCount
            }
        });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to update vote',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Handle downvote
const handleDownvote = async (req, res) => {
    try {
        // Validate post ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid post ID' 
            });
        }

        const post = await Post.findById(req.params.id).populate('author', '_id');
        if (!post) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Post not found' 
            });
        }

        const userId = req.user._id;
        const isUpvoted = post.votes.upvotes.some(id => id.toString() === userId.toString());
        const isDownvoted = post.votes.downvotes.some(id => id.toString() === userId.toString());

        if (isDownvoted) {
            // Remove downvote
            post.votes.downvotes = post.votes.downvotes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add downvote and remove upvote if exists
            post.votes.downvotes.push(userId);
            if (isUpvoted) {
                post.votes.upvotes = post.votes.upvotes.filter(id => id.toString() !== userId.toString());
            }

            // Create notification if it's not a self-downvote
            if (post.author._id.toString() !== userId.toString()) {
                const Notification = require('../models/notificationModel');
                await Notification.create({
                    recipient: post.author._id,
                    sender: userId,
                    type: 'POST_LIKE',
                    post: post._id,
                    isRead: false,
                    isSeen: false
                });
            }
        }

        await post.save();

        res.json({
            status: 'success',
            data: {
                isUpvoted: false,
                isDownvoted: !isDownvoted,
                voteCount: post.voteCount
            }
        });
    } catch (error) {
        console.error('Downvote error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to update vote',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createPost,
    getPost,
    deletePost,
    getHomeFeed,
    getPublicFeed,
    handleUpvote,
    handleDownvote,
    getVoteStatus
};
