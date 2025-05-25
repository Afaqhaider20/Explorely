const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
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
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');
const Community = require('../models/communityModel');
const Post = require('../models/postModel');
const Itinerary = require('../models/communityItineraryModel');

// Create community with optional avatar
router.post('/', protect, upload.single('avatar'), createCommunity);

// Get top communities - No authentication required
router.get('/top', getTopCommunities);

// Get community details
router.get('/:id', protect, getCommunity);

// Update community
router.put('/:id', protect, upload.single('avatar'), updateCommunity);

// Get community posts
router.get('/:id/posts', protect, getCommunityPosts);

// Toggle membership (join/leave)
router.post('/:id/toggle-membership', protect, toggleMembership);

// Block member
router.post('/:id/block-member', protect, blockMember);

// Unblock member
router.post('/:id/unblock-member', protect, unblockMember);

// Delete community
router.delete('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if the user is the owner of the community
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the community owner can delete it' });
    }

    // Delete all posts associated with the community
    await Post.deleteMany({ community: req.params.id });

    // Delete all itineraries associated with the community
    await Itinerary.deleteMany({ communityId: req.params.id });

    // Delete the community
    await Community.findByIdAndDelete(req.params.id);

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ message: 'Error deleting community' });
  }
});

// Keep the old routes for backward compatibility, but they could be deprecated in the future
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;
