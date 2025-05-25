const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/notificationModel');

// Get recent notifications for dropdown (limited to 5)
router.get('/recent', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'username avatar')
      .populate('post', 'title')
      .populate('comment', 'content')
      .populate('review', 'title')
      .populate('reviewComment', 'content')
      .populate('community', 'name')
      .populate('itinerary', 'title');

    const unseenCount = await Notification.countDocuments({
      recipient: req.user._id,
      isSeen: false
    });

    res.json({
      notifications,
      unseenCount
    });
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Error fetching recent notifications' });
  }
});

// Get user's notifications with pagination (for notifications page)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('post', 'title')
        .populate('comment', 'content')
        .populate('review', 'title')
        .populate('reviewComment', 'content')
        .populate('community', 'name')
        .populate('itinerary', 'title'),
      Notification.countDocuments({ recipient: req.user._id })
    ]);

    const hasMore = skip + notifications.length < total;

    res.json({
      notifications,
      hasMore,
      total
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark a single notification as read
router.post('/:notificationId/mark-read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// Mark all notifications as read
router.post('/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// Mark all notifications as seen
router.post('/mark-seen', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isSeen: false },
      { isSeen: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    res.status(500).json({ message: 'Error marking notifications as seen' });
  }
});

module.exports = router; 