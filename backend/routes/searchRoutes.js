const express = require('express');
const router = express.Router();
const Post = require('../models/postModel');
const Community = require('../models/communityModel');
const Comment = require('../models/commentModel');

// Search functionality
router.get('/', async (req, res) => {
    try {
        const { query, type = 'all' } = req.query;
        
        // Validate query parameter
        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const results = {
            posts: [],
            communities: []
            // Removed users array from results
        };

        // Normalize search type and prepare regex pattern for partial matching
        const searchType = type.toLowerCase();
        const searchRegex = new RegExp(query, 'i');

        // Search Posts
        if (searchType === 'all' || searchType === 'posts') {
            // Use text search first for better relevance
            const textSearchPostsIds = await Post.find({ $text: { $search: query } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(8)
                .select('_id')
                .lean();
            
            const textSearchPostIds = textSearchPostsIds.map(post => post._id);
            
            // Also search by regex for partial matches in title and content
            const regexSearchPostIds = await Post.find({
                $or: [
                    { title: searchRegex },
                    { content: searchRegex }
                ],
                _id: { $nin: textSearchPostIds } // Exclude posts already found
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id')
                .lean();
            
            const allPostIds = [...textSearchPostIds, ...regexSearchPostIds.map(post => post._id)];
            
            // Fetch full post data with proper population
            const posts = await Post.find({ _id: { $in: allPostIds } })
                .select('_id title content media createdAt updatedAt voteCount')
                .populate('author', '_id username avatar')
                .populate('community', '_id name creator')
                .lean();
                
            // Add comment count to posts
            const postsWithCommentCount = await Promise.all(posts.map(async post => {
                const commentCount = await Comment.countDocuments({ post: post._id });
                return {
                    ...post,
                    commentCount
                };
            }));
            
            results.posts = postsWithCommentCount;
        }

        // Search Communities
        if (searchType === 'all' || searchType === 'communities') {
            // Use text search first
            const textSearchCommunities = await Community.find({ $text: { $search: query } })
                .select('name description avatar memberCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(8)
                .lean();
            
            // Also search by regex for partial matches in name and description
            const regexSearchCommunities = await Community.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ],
                _id: { $nin: textSearchCommunities.map(comm => comm._id) } // Exclude communities already found
            })
                .select('name description avatar members')
                .limit(5)
                .lean();
                
            // Add member count to communities from regex search
            const communitiesWithMemberCount = regexSearchCommunities.map(community => ({
                ...community,
                memberCount: community.members ? community.members.length : 0,
                members: undefined // Remove members array
            }));
                
            results.communities = [...textSearchCommunities, ...communitiesWithMemberCount];
        }

        // Removed users search completely

        // Send results
        res.json({
            query,
            type: searchType,
            results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
