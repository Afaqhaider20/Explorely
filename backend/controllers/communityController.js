const Community = require('../models/communityModel');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// Create a new community
const createCommunity = async (req, res) => {
    try {
        const { name, description } = req.body;
        let rules = [];

        // Parse rules from string to array
        try {
            rules = JSON.parse(req.body.rules);
        } catch (error) {
            return res.status(400).json({ 
                message: 'Rules must be a valid JSON array' 
            });
        }

        // Validate required fields
        if (!name || !description || !Array.isArray(rules)) {
            return res.status(400).json({ 
                message: 'Name, description, and rules are required. Rules must be an array.' 
            });
        }

        // Validate rules format
        if (rules.length === 0) {
            return res.status(400).json({
                message: 'At least one community rule is required'
            });
        }

        // Check if community exists
        const communityExists = await Community.findOne({ name });
        if (communityExists) {
            return res.status(400).json({ message: 'Community already exists' });
        }

        // Upload avatar if provided
        let avatarUrl = 'default-community.png';
        if (req.file) {
            avatarUrl = await uploadToCloudinary(req.file, 'explorely/communities');
        }

        // Create community with rules and avatar
        const community = await Community.create({
            name,
            description,
            avatar: avatarUrl,
            rules: rules.map((rule, index) => ({
                order: index + 1,
                content: rule
            })),
            creator: req.user._id,
            moderators: [req.user._id],
            members: [req.user._id]
        });

        // Fetch the populated community without duplicate ID
        const populatedCommunity = await Community.findById(community._id)
            .populate('creator', 'username')
            .populate('moderators', 'username')
            .populate('members', 'username')
            .lean(); // Convert to plain object

        // Add community to user's joined communities
        await User.findByIdAndUpdate(req.user._id, {
            $push: { joinedCommunities: community._id }
        });

        res.status(201).json({
            status: 'success',
            data: { community: populatedCommunity }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific community
const getCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('creator', 'username avatar')
            .populate('moderators', 'username avatar')
            .populate('members', 'username avatar')
            .populate('blockedMembers', 'username avatar')
            .lean();

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is blocked
        if (community.blockedMembers && 
            community.blockedMembers.some(member => 
                member && member._id && member._id.toString() === req.user._id.toString()
            )) {
            return res.status(403).json({ 
                message: 'You have been blocked from accessing this community' 
            });
        }

        // Format the response
        const formattedCommunity = {
            ...community,
            memberCount: (community.members || []).length,
            blockedMembers: community.blockedMembers || []
        };

        res.status(200).json({
            status: 'success',
            data: { community: formattedCommunity }
        });
    } catch (error) {
        console.error('Error in getCommunity:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Community not found' });
        }
        res.status(500).json({ 
            message: 'Failed to load community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get community posts with pagination
const getCommunityPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ community: req.params.id })
            .select('title content media voteCount createdAt updatedAt')
            .populate('author', 'username avatar')
            .populate('community', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get comment counts for each post
        const postsWithCommentCounts = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount,
                voteCount: post.voteCount || 0
            };
        }));

        const totalPosts = await Post.countDocuments({ community: req.params.id });

        res.status(200).json({
            status: 'success',
            data: {
                posts: postsWithCommentCounts,
                pagination: {
                    page,
                    limit,
                    hasMore: totalPosts > skip + posts.length,
                    total: totalPosts
                }
            }
        });
    } catch (error) {
        console.error('Error in getCommunityPosts:', error);
        res.status(500).json({ 
            message: 'Failed to load community posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Join a community
const joinCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is already a member
        if (community.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already a member of this community' });
        }

        // Add user to community members
        community.members.push(req.user._id);
        await community.save();

        // Add community to user's joined communities
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { joinedCommunities: community._id }
        });

        res.status(200).json({
            status: 'success',
            message: 'Successfully joined community'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave a community
const leaveCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is a member
        if (!community.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Not a member of this community' });
        }

        // Check if user is the creator
        if (community.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Community creator cannot leave the community' });
        }

        // Remove user from community members
        community.members = community.members.filter(
            memberId => memberId.toString() !== req.user._id.toString()
        );
        
        // Remove user from moderators if they are one
        community.moderators = community.moderators.filter(
            modId => modId.toString() !== req.user._id.toString()
        );
        
        await community.save();

        // Remove community from user's joined communities
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { joinedCommunities: community._id }
        });

        res.status(200).json({
            status: 'success',
            message: 'Successfully left community'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle community membership (join/leave)
const toggleMembership = async (req, res) => {
    try {
        const communityId = req.params.id;
        const userId = req.user._id;
        
        const community = await Community.findById(communityId);
        
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is already a member
        const isMember = community.members.some(
            memberId => memberId.toString() === userId.toString()
        );

        // If user is the creator, they can't leave
        if (isMember && community.creator.toString() === userId.toString()) {
            return res.status(400).json({ 
                message: 'Community creator cannot leave the community',
                action: 'none'
            });
        }

        if (isMember) {
            // Leave the community
            community.members = community.members.filter(
                memberId => memberId.toString() !== userId.toString()
            );
            
            // Remove user from moderators if they are one
            community.moderators = community.moderators.filter(
                modId => modId.toString() !== userId.toString()
            );
            
            await community.save();

            // Remove community from user's joined communities
            await User.findByIdAndUpdate(userId, {
                $pull: { joinedCommunities: communityId }
            });

            res.status(200).json({
                status: 'success',
                message: 'Successfully left community',
                action: 'left',
                memberCount: community.members.length
            });
        } else {
            // Join the community
            community.members.push(userId);
            await community.save();

            // Add community to user's joined communities
            await User.findByIdAndUpdate(userId, {
                $addToSet: { joinedCommunities: communityId }
            });

            res.status(200).json({
                status: 'success',
                message: 'Successfully joined community',
                action: 'joined',
                memberCount: community.members.length
            });
        }
    } catch (error) {
        console.error('Toggle membership error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Block a member from the community
const blockMember = async (req, res) => {
    try {
        const { memberId } = req.body;
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is owner or moderator
        if (community.creator.toString() !== req.user._id.toString() && 
            !community.moderators.includes(req.user._id)) {
            return res.status(403).json({ message: 'Only owner or moderators can block members' });
        }

        // Check if member exists
        const member = await User.findById(memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Check if member is already blocked
        if (community.blockedMembers.includes(memberId)) {
            return res.status(400).json({ message: 'Member is already blocked' });
        }

        // Remove member from members array and add to blockedMembers
        community.members = community.members.filter(id => id.toString() !== memberId);
        community.blockedMembers.push(memberId);

        // Remove community from user's joined communities
        await User.findByIdAndUpdate(memberId, {
            $pull: { joinedCommunities: community._id }
        });

        await community.save();

        res.status(200).json({
            status: 'success',
            message: 'Member blocked successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unblock a member from the community
const unblockMember = async (req, res) => {
    try {
        const { memberId } = req.body;
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is owner or moderator
        if (community.creator.toString() !== req.user._id.toString() && 
            !community.moderators.includes(req.user._id)) {
            return res.status(403).json({ message: 'Only owner or moderators can unblock members' });
        }

        // Check if member is blocked
        if (!community.blockedMembers.includes(memberId)) {
            return res.status(400).json({ message: 'Member is not blocked' });
        }

        // Remove member from blockedMembers array
        community.blockedMembers = community.blockedMembers.filter(id => id.toString() !== memberId);
        await community.save();

        res.status(200).json({
            status: 'success',
            message: 'Member unblocked successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a community
const updateCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is the owner
        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the community owner can update the community' });
        }

        const { name, description } = req.body;
        let rules = [];

        // Parse rules from string to array
        try {
            rules = JSON.parse(req.body.rules);
        } catch (error) {
            return res.status(400).json({ 
                message: 'Rules must be a valid JSON array' 
            });
        }

        // Validate required fields
        if (!name || !description || !Array.isArray(rules)) {
            return res.status(400).json({ 
                message: 'Name, description, and rules are required. Rules must be an array.' 
            });
        }

        // Validate rules format
        if (rules.length === 0) {
            return res.status(400).json({
                message: 'At least one community rule is required'
            });
        }

        // Check if name is taken by another community
        const communityExists = await Community.findOne({ 
            name, 
            _id: { $ne: community._id } 
        });
        if (communityExists) {
            return res.status(400).json({ message: 'Community name already taken' });
        }

        // Upload new avatar if provided
        let avatarUrl = community.avatar;
        if (req.file) {
            avatarUrl = await uploadToCloudinary(req.file, 'explorely/communities');
        }

        // Update community
        community.name = name;
        community.description = description;
        community.avatar = avatarUrl;
        community.rules = rules.map((rule, index) => ({
            order: index + 1,
            content: rule
        }));

        await community.save();

        // Fetch the updated community with populated fields
        const updatedCommunity = await Community.findById(community._id)
            .populate('creator', 'username avatar')
            .populate('moderators', 'username avatar')
            .populate('members', 'username avatar')
            .populate('blockedMembers', 'username avatar')
            .lean();

        res.status(200).json({
            status: 'success',
            data: { community: updatedCommunity }
        });
    } catch (error) {
        console.error('Error in updateCommunity:', error);
        res.status(500).json({ 
            message: 'Failed to update community',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get top communities
const getTopCommunities = async (req, res) => {
    try {
        const communities = await Community.aggregate([
            {
                $lookup: {
                    from: 'posts',
                    localField: '_id',
                    foreignField: 'community',
                    as: 'posts'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    avatar: 1,
                    memberCount: { $size: '$members' },
                    postCount: { $size: '$posts' },
                    score: {
                        $add: [
                            { $size: '$members' },
                            { $multiply: [{ $size: '$posts' }, 2] } // Posts count double
                        ]
                    }
                }
            },
            {
                $sort: { score: -1 }
            },
            {
                $limit: 3
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { communities }
        });
    } catch (error) {
        console.error('Error in getTopCommunities:', error);
        res.status(500).json({ 
            message: 'Failed to load top communities',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createCommunity,
    getCommunity,
    getCommunityPosts,
    joinCommunity,
    leaveCommunity,
    toggleMembership,
    blockMember,
    unblockMember,
    updateCommunity,
    getTopCommunities
};
