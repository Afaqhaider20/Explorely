const Post = require('../models/postModel');
const Community = require('../models/communityModel');

const search = async (req, res) => {
    try {
        const { query, type = 'all' } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        let results = {};

        // Search based on type parameter
        if (type === 'all' || type === 'posts') {
            const posts = await Post.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username')
            .populate('community', 'name');

            if (type === 'all') {
                results.posts = posts;
            } else {
                results = posts;
            }
        }

        if (type === 'all' || type === 'communities') {
            const communities = await Community.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .select('name description memberCount');

            if (type === 'all') {
                results.communities = communities;
            } else {
                results = communities;
            }
        }

        res.json({
            results,
            page,
            limit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    search
};
