const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Community = require('../models/communityModel');
const Comment = require('../models/commentModel');
const Report = require('../models/reportModel');
const Review = require('../models/reviewModel');
const { getReports, getItemReports, updateReportStatus } = require('../controllers/reportController');

// GET /api/admin/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCommunities = await Community.countDocuments();
    const totalReports = await Report.countDocuments();

    // Get activity data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get daily counts for users, posts, communities, and reports
    const [userActivity, postActivity, communityActivity, reportActivity] = await Promise.all([
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Post.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Community.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Report.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Generate all dates in the last 30 days
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Create a map for each activity type
    const userMap = new Map(userActivity.map(item => [item._id, item.count]));
    const postMap = new Map(postActivity.map(item => [item._id, item.count]));
    const communityMap = new Map(communityActivity.map(item => [item._id, item.count]));
    const reportMap = new Map(reportActivity.map(item => [item._id, item.count]));

    // Combine all activity data
    const recentActivity = dates.map(date => ({
      date,
      newUsers: userMap.get(date) || 0,
      newPosts: postMap.get(date) || 0,
      newCommunities: communityMap.get(date) || 0,
      newReports: reportMap.get(date) || 0
    }));

    // Get top communities by member count
    const topCommunities = await Community.aggregate([
      {
        $project: {
          name: 1,
          memberCount: { $size: { $ifNull: ["$members", []] } }
        }
      },
      { $sort: { memberCount: -1 } },
      { $limit: 5 }
    ]);

    // Get post activity for the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Generate all dates for the last month
    const allDates = [];
    const currentDate = new Date();
    let date = new Date(lastMonth);
    while (date <= currentDate) {
      allDates.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }

    // Get post counts by community for the last month
    const communityPostActivity = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth }
        }
      },
      {
        $lookup: {
          from: 'communities',
          localField: 'community',
          foreignField: '_id',
          as: 'communityInfo'
        }
      },
      {
        $unwind: '$communityInfo'
      },
      {
        $group: {
          _id: {
            communityId: '$community',
            communityName: '$communityInfo.name',
            date: { 
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$createdAt" 
              } 
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            communityId: '$_id.communityId',
            communityName: '$_id.communityName'
          },
          dates: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          },
          totalPosts: { $sum: '$count' }
        }
      },
      {
        $sort: { totalPosts: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Process and fill in missing dates for each community
    const processedCommunities = communityPostActivity.map(community => {
      const dateMap = new Map(community.dates.map(d => [d.date, d.count]));
      
      // Fill in all dates, using 0 for dates with no posts
      const filledDates = allDates.map(date => ({
        date,
        count: dateMap.get(date) || 0
      }));

      return {
        communityName: community._id.communityName,
        postCount: community.totalPosts,
        dates: filledDates
      };
    });

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalCommunities,
        totalReports
      },
      topCommunities: topCommunities.map(community => ({
        id: community._id.toString(),
        name: community.name,
        memberCount: community.memberCount
      })),
      postActivity: processedCommunities,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/users - Get all users with pagination
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = { isAdmin: { $ne: true } };
    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find users that have reports
      const usersWithReports = await Report.distinct('reportedUser', {
        reportedType: 'user',
        status: { $ne: 'dismissed' }
      });

      query = {
        ...query,
        _id: { $in: usersWithReports }
      };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const users = await User.find(query)
      .select('_id username email avatar createdAt isBanned')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each user
    const usersWithReports = await Promise.all(users.map(async (user) => {
      const reports = await Report.find({ 
        reportedType: 'user',
        reportedUser: user._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        isBanned: user.isBanned,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = filter === 'reported' 
      ? await User.countDocuments(query)
      : await User.countDocuments({ isAdmin: { $ne: true } });

    res.json({
      users: usersWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/users/search - Search users by username or email
router.get('/users/search', protect, isAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = {
      isAdmin: { $ne: true },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find users that have reports
      const usersWithReports = await Report.distinct('reportedUser', {
        reportedType: 'user',
        status: { $ne: 'dismissed' }
      });

      searchQuery = {
        ...searchQuery,
        _id: { $in: usersWithReports }
      };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const users = await User.find(searchQuery)
      .select('_id username email avatar createdAt isBanned')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each user
    const usersWithReports = await Promise.all(users.map(async (user) => {
      const reports = await Report.find({ 
        reportedType: 'user',
        reportedUser: user._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        isBanned: user.isBanned,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await User.countDocuments(searchQuery);

    res.json({
      users: usersWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/communities - Get all communities with pagination
router.get('/communities', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = {};
    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find communities that have reports
      const communitiesWithReports = await Report.distinct('reportedCommunity', {
        reportedType: 'community',
        status: { $ne: 'dismissed' }
      });

      query = { _id: { $in: communitiesWithReports } };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const communities = await Community.find(query)
      .select('_id name description avatar createdAt members')
      .populate({
        path: 'creator',
        select: 'username avatar',
        options: { lean: true }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each community
    const communitiesWithReports = await Promise.all(communities.map(async (community) => {
      try {
        const reports = await Report.find({ 
          reportedType: 'community',
          reportedCommunity: community._id,
          status: { $ne: 'dismissed' }
        }).select('reason');

        return {
          _id: community._id,
          name: community.name,
          description: community.description,
          avatar: community.avatar,
          createdAt: community.createdAt,
          creator: community.creator ? {
            username: community.creator.username || 'Deleted User',
            avatar: community.creator.avatar || 'default-avatar.png'
          } : {
            username: 'Deleted User',
            avatar: 'default-avatar.png'
          },
          memberCount: Array.isArray(community.members) ? community.members.length : 0,
          reportCount: reports.length,
          reports: reports.map(report => ({
            reason: report.reason
          }))
        };
      } catch (error) {
        console.error(`Error processing community ${community._id}:`, error);
        return null;
      }
    }));

    // Filter out any null results from failed processing
    const validCommunities = communitiesWithReports.filter(community => community !== null);

    const total = filter === 'reported' 
      ? await Community.countDocuments(query)
      : await Community.countDocuments();

    res.json({
      communities: validCommunities,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCommunities: total
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/communities/search - Search communities by name or description
router.get('/communities/search', protect, isAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find communities that have reports
      const communitiesWithReports = await Report.distinct('reportedCommunity', {
        reportedType: 'community',
        status: { $ne: 'dismissed' }
      });

      searchQuery = {
        ...searchQuery,
        _id: { $in: communitiesWithReports }
      };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const communities = await Community.find(searchQuery)
      .select('_id name description avatar createdAt')
      .populate('creator', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each community
    const communitiesWithReports = await Promise.all(communities.map(async (community) => {
      const reports = await Report.find({ 
        reportedType: 'community',
        reportedCommunity: community._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: community._id,
        name: community.name,
        description: community.description,
        avatar: community.avatar,
        createdAt: community.createdAt,
        creator: {
          username: community.creator.username,
          avatar: community.creator.avatar
        },
        memberCount: community.members ? community.members.length : 0,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await Community.countDocuments(searchQuery);

    res.json({
      communities: communitiesWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCommunities: total
    });
  } catch (error) {
    console.error('Error searching communities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/communities/:id - Delete a community and all its associated content
router.delete('/communities/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find all posts in the community
    const posts = await Post.find({ community: id });
    const postIds = posts.map(post => post._id);

    // Delete all comments associated with these posts
    await Comment.deleteMany({ post: { $in: postIds } });

    // Delete all posts in the community
    await Post.deleteMany({ community: id });

    // Delete the community
    const deletedCommunity = await Community.findByIdAndDelete(id);

    if (!deletedCommunity) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json({ 
      message: 'Community and all associated content deleted successfully',
      deletedCommunity
    });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ban a user
router.put('/users/:userId/ban', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = true;
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Error banning user' });
  }
});

// Unban a user
router.put('/users/:userId/unban', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = false;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Error unbanning user' });
  }
});

// Delete a user
router.delete('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's posts
    await Post.deleteMany({ author: user._id });
    
    // Delete user's comments
    await Comment.deleteMany({ author: user._id });
    
    // Remove user from communities
    await Community.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    // Delete the user
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get active users
router.get('/users/active', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      isAdmin: { $ne: true },
      isBanned: false,
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('_id username email avatar createdAt isBanned')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get report information for each user
    const usersWithReports = await Promise.all(users.map(async (user) => {
      const reports = await Report.find({ 
        reportedType: 'user',
        reportedUser: user._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        isBanned: user.isBanned,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ message: 'Error fetching active users' });
  }
});

// Get banned users
router.get('/users/banned', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      isAdmin: { $ne: true },
      isBanned: true,
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('_id username email avatar createdAt isBanned')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get report information for each user
    const usersWithReports = await Promise.all(users.map(async (user) => {
      const reports = await Report.find({ 
        reportedType: 'user',
        reportedUser: user._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        isBanned: user.isBanned,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Error fetching banned users:', error);
    res.status(500).json({ message: 'Error fetching banned users' });
  }
});

// GET /api/admin/reports - Get all reports with filtering and pagination
router.get('/reports', protect, isAdmin, getReports);

// GET /api/admin/reports/item/:type/:id - Get item reports
router.get('/reports/item/:type/:id', protect, isAdmin, getItemReports);

// PATCH /api/admin/reports/:id/status - Update report status
router.patch('/reports/:id/status', protect, isAdmin, updateReportStatus);

// PATCH /api/admin/reports/:id/notes - Update report notes
router.patch('/reports/:id/notes', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const report = await Report.findByIdAndUpdate(
      id,
      { adminNotes: notes },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating report notes:', error);
    res.status(500).json({ message: 'Failed to update report notes' });
  }
});

// GET /api/admin/reports/stats - Get report statistics
router.get('/reports/stats', protect, isAdmin, async (req, res) => {
  try {
    // Get total counts by type
    const typeStats = await Report.aggregate([
      {
        $group: {
          _id: '$reportedType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total counts by status
    const statusStats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReports = await Report.find({
      createdAt: { $gte: sevenDaysAgo }
    }).count();

    res.json({
      typeStats: typeStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      statusStats: statusStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentReports
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/reports/analytics - Get report analytics for the last 30 days
router.get('/reports/analytics', protect, isAdmin, async (req, res) => {
  try {
    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily report counts for the last 30 days
    const dailyReports = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          total: { $sum: 1 },
          reviewed: {
            $sum: {
              $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0]
            }
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
            }
          },
          dismissed: {
            $sum: {
              $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format the data to match the frontend's expected structure
    const formattedData = dailyReports.map(report => ({
      day: new Date(report._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      total: report.total,
      reviewed: report.reviewed,
      resolved: report.resolved,
      dismissed: report.dismissed
    }));

    // Calculate month totals
    const monthTotals = {
      total: formattedData.reduce((sum, d) => sum + d.total, 0),
      reviewed: formattedData.reduce((sum, d) => sum + d.reviewed, 0),
      resolved: formattedData.reduce((sum, d) => sum + d.resolved, 0),
      dismissed: formattedData.reduce((sum, d) => sum + d.dismissed, 0)
    };

    res.json({
      dailyData: formattedData,
      monthTotals
    });
  } catch (error) {
    console.error('Error fetching report analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/posts - Get all posts with pagination
router.get('/posts', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = {};
    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find posts that have reports
      const postsWithReports = await Report.distinct('reportedPost', {
        reportedType: 'post',
        status: { $ne: 'dismissed' }
      });

      query = { _id: { $in: postsWithReports } };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const posts = await Post.find(query)
      .select('_id title content createdAt author community voteCount comments')
      .populate('author', 'username avatar')
      .populate('community', 'name _id')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each post
    const postsWithReports = await Promise.all(posts.map(async (post) => {
      const reports = await Report.find({ 
        reportedType: 'post',
        reportedPost: post._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: post._id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: post.author ? {
          username: post.author.username,
          avatar: post.author.avatar
        } : null,
        community: post.community ? {
          name: post.community.name,
          _id: post.community._id
        } : null,
        voteCount: post.voteCount || 0,
        commentCount: post.comments?.length || 0,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = filter === 'reported' 
      ? await Post.countDocuments(query)
      : await Post.countDocuments();

    res.json({
      posts: postsWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/posts/search - Search posts by title or content
router.get('/posts/search', protect, isAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    };

    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find posts that have reports
      const postsWithReports = await Report.distinct('reportedPost', {
        reportedType: 'post',
        status: { $ne: 'dismissed' }
      });

      searchQuery = {
        ...searchQuery,
        _id: { $in: postsWithReports }
      };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const posts = await Post.find(searchQuery)
      .select('_id title content createdAt author community voteCount comments')
      .populate('author', 'username avatar')
      .populate('community', 'name _id')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each post
    const postsWithReports = await Promise.all(posts.map(async (post) => {
      const reports = await Report.find({ 
        reportedType: 'post',
        reportedPost: post._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: post._id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: post.author ? {
          username: post.author.username,
          avatar: post.author.avatar
        } : null,
        community: post.community ? {
          name: post.community.name,
          _id: post.community._id
        } : null,
        voteCount: post.voteCount || 0,
        commentCount: post.comments?.length || 0,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await Post.countDocuments(searchQuery);

    res.json({
      posts: postsWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/posts/:id - Delete a post and its comments
router.delete('/posts/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: id });

    // Delete the post
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ 
      message: 'Post and all associated comments deleted successfully',
      deletedPost
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/reviews - Get all reviews with pagination
router.get('/reviews', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = {};
    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find reviews that have reports
      const reviewsWithReports = await Report.distinct('reportedReview', {
        reportedType: 'review',
        status: { $ne: 'dismissed' }
      });

      query = { _id: { $in: reviewsWithReports } };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const reviews = await Review.find(query)
      .select('_id title content rating createdAt author location likes')
      .populate('author', 'username avatar')
      .populate('location', 'name _id')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each review
    const reviewsWithReports = await Promise.all(reviews.map(async (review) => {
      const reports = await Report.find({ 
        reportedType: 'review',
        reportedReview: review._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: review._id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        createdAt: review.createdAt,
        author: review.author ? {
          username: review.author.username,
          avatar: review.author.avatar
        } : null,
        location: review.location ? {
          name: review.location.name,
          _id: review.location._id
        } : null,
        likes: review.likes || 0,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = filter === 'reported' 
      ? await Review.countDocuments(query)
      : await Review.countDocuments();

    res.json({
      reviews: reviewsWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/reviews/search - Search reviews by title or content
router.get('/reviews/search', protect, isAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    };

    let sort = { createdAt: -1 };

    if (filter === 'reported') {
      // Find reviews that have reports
      const reviewsWithReports = await Report.distinct('reportedReview', {
        reportedType: 'review',
        status: { $ne: 'dismissed' }
      });

      searchQuery = {
        ...searchQuery,
        _id: { $in: reviewsWithReports }
      };
      sort = { reportCount: -1 }; // Sort by report count
    }

    const reviews = await Review.find(searchQuery)
      .select('_id title content rating createdAt author location likes')
      .populate('author', 'username avatar')
      .populate('location', 'name _id')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get report information for each review
    const reviewsWithReports = await Promise.all(reviews.map(async (review) => {
      const reports = await Report.find({ 
        reportedType: 'review',
        reportedReview: review._id,
        status: { $ne: 'dismissed' }
      }).select('reason');

      return {
        _id: review._id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        createdAt: review.createdAt,
        author: review.author ? {
          username: review.author.username,
          avatar: review.author.avatar
        } : null,
        location: review.location ? {
          name: review.location.name,
          _id: review.location._id
        } : null,
        likes: review.likes || 0,
        reportCount: reports.length,
        reports: reports.map(report => ({
          reason: report.reason
        }))
      };
    }));

    const total = await Review.countDocuments(searchQuery);

    res.json({
      reviews: reviewsWithReports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error('Error searching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/reviews/:id - Delete a review
router.delete('/reviews/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the review
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ 
      message: 'Review deleted successfully',
      deletedReview
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 