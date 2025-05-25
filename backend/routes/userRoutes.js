const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
    registerUser, 
    loginUser, 
    getProfile, 
    logoutUser, 
    updateProfile,
    getProfileById,
    refreshToken
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/logout', protect, logoutUser);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

// Get unread messages status - must be before /:id route
router.get('/unread-messages', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simply check if there are any unread messages
    const hasUnread = Array.isArray(user.unreadMessages) && user.unreadMessages.length > 0;
    
    res.json({ hasUnread });
  } catch (error) {
    res.status(500).json({ message: 'Error checking unread messages' });
  }
});

// Mark messages as read
router.post('/mark-messages-read', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear unread messages array
    user.unreadMessages = [];
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Get total unread message counts
router.get('/unread-counts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total unread count across all communities
    const totalCount = user.unreadMessages.reduce((sum, msg) => sum + (msg.count || 0), 0);

    res.json({ 
      totalCount,
      unreadByCommunity: user.unreadMessages.map(msg => ({
        communityId: msg.community,
        count: msg.count,
        lastRead: msg.lastRead
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread counts' });
  }
});

// Get total unread message count for navbar
router.get('/navbar-unread-count', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total unread count across all communities
    const totalCount = user.unreadMessages.reduce((sum, msg) => sum + (msg.count || 0), 0);

    res.json({ 
      totalUnreadCount: totalCount,
      hasUnread: totalCount > 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count for navbar' });
  }
});

// Get last message for each joined community
router.get('/communities-last-messages', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('joinedCommunities', 'name avatar description')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the last message for each community
    const communitiesWithLastMessage = await Promise.all(
      user.joinedCommunities.map(async (community) => {
        // Find the last message for this community
        const lastMessage = await Message.findOne(
          { community: community._id },
          {
            content: 1,
            timestamp: 1,
            user: 1
          }
        )
        .sort({ timestamp: -1 })
        .populate('user', 'username avatar')
        .lean();

        // Get unread count for this community
        const unreadInfo = user.unreadMessages.find(
          msg => msg.community.toString() === community._id.toString()
        );

        // Get total message count for this community
        const messageCount = await Message.countDocuments({ community: community._id });

        return {
          community: {
            _id: community._id,
            name: community.name,
            avatar: community.avatar,
            description: community.description
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            sender: lastMessage.user ? {
              _id: lastMessage.user._id,
              username: lastMessage.user.username,
              avatar: lastMessage.user.avatar
            } : {
              _id: 'deleted',
              username: 'Deleted User',
              avatar: null
            }
          } : null,
          messageCount,
          unreadCount: unreadInfo?.count || 0,
          lastRead: unreadInfo?.lastRead || new Date()
        };
      })
    );

    // Sort communities by:
    // 1. Has unread messages (highest priority)
    // 2. Last message timestamp
    // 3. Message count
    const sortedCommunities = communitiesWithLastMessage.sort((a, b) => {
      // First sort by unread count
      if (a.unreadCount !== b.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      
      // Then by last message timestamp
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      
      // Finally by message count
      return b.messageCount - a.messageCount;
    });

    res.json(sortedCommunities);
  } catch (error) {
    console.error('Error fetching communities last messages:', error);
    res.status(500).json({ message: 'Error fetching communities last messages' });
  }
});

// Check if user is admin
router.get('/check-admin', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ isAdmin: !!user.isAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
});

// Parameterized routes should be last
router.get('/:id', protect, getProfileById);

// Temporary route for testing
router.get('/', (req, res) => {
    res.status(200).json({ message: 'User routes working' });
});

module.exports = router;
