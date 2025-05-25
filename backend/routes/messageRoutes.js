const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');
const { protect } = require('../middleware/authMiddleware');

// Get messages for a community with pagination
router.get('/community/:communityId', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { limit = 50, before } = req.query;

    const query = { community: communityId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('user', 'username avatar')
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Search messages in a community
router.get('/search/:communityId', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { query } = req.query;

    const messages = await Message.find({
      community: communityId,
      $text: { $search: query }
    })
      .sort({ timestamp: -1 })
      .populate('user', 'username avatar')
      .lean();

    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Error searching messages' });
  }
});

// Delete a message (only by the sender)
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.remove();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router; 