const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    createChannel, 
    getChannels,
    getChannelMessages 
} = require('../controllers/channelController');

// Create a new channel (admin only)
router.post('/communities/:communityId/channels', protect, createChannel);

// Get all channels for a community
router.get('/communities/:communityId/channels', getChannels);

// Get messages for a channel
router.get('/communities/:communityId/channels/:channelId/messages', protect, getChannelMessages);

module.exports = router;
