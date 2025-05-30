const express = require('express');
const router = express.Router();
const Community = require('../models/communityModel');
const Post = require('../models/postModel');
const { protect } = require('../middleware/authMiddleware');

// Get trending communities and posts
router.get('/', async (req, res) => {
  try {
    // Get trending communities (most members in last 7 days)
    const trendingCommunities = await Community.find()
      .sort({ members: -1 })
      .limit(6)
      .select('name description avatar members')
      .lean();

    // Get post counts for each community
    const communityIds = trendingCommunities.map(community => community._id);
    const postCounts = await Post.aggregate([
      { $match: { community: { $in: communityIds } } },
      { $group: { _id: '$community', count: { $sum: 1 } } }
    ]);

    // Create a map of community ID to post count
    const postCountMap = postCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Transform communities to include memberCount, avatar, and postCount
    const transformedCommunities = trendingCommunities.map(community => ({
      ...community,
      memberCount: community.members.length,
      avatar: community.avatar,
      postCount: postCountMap[community._id.toString()] || 0,
      members: undefined
    }));

    // Get trending posts (most votes in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trendingPosts = await Post.find({
      createdAt: { $gte: oneDayAgo }
    })
      .sort({ voteCount: -1 })
      .limit(10)
      .populate('author', 'username avatar')
      .populate('community', 'name avatar')
      .lean();

    // Transform posts to include upvotes and downvotes counts
    const transformedPosts = trendingPosts.map(post => ({
      ...post,
      upvotes: post.votes?.upvotes?.length || 0,
      downvotes: post.votes?.downvotes?.length || 0,
      votes: undefined
    }));

    res.json({
      status: 'success',
      data: {
        trendingCommunities: transformedCommunities,
        trendingPosts: transformedPosts
      }
    });
  } catch (error) {
    console.error('Explore route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch explore data'
    });
  }
});

module.exports = router; 