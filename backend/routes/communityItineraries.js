const express = require('express');
const router = express.Router();
const CommunityItinerary = require('../models/communityItineraryModel');
const Community = require('../models/communityModel');
const Notification = require('../models/notificationModel');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a new community itinerary
// @route   POST /api/communities/:communityId/itineraries
// @access  Private (Community members only)
router.post('/:communityId/itineraries', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId).populate('members', '_id');
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member of the community
    const isMember = community.members.some(member => member._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of the community to create an itinerary' });
    }

    const itinerary = new CommunityItinerary({
      ...req.body,
      author: req.user._id,
      community: req.params.communityId
    });

    await itinerary.save();

    // Add the itinerary to the community's itineraries array
    community.itineraries.push(itinerary._id);
    await community.save();

    // Create notifications for all community members except the itinerary author
    const notificationPromises = community.members
      .filter(member => member._id.toString() !== req.user._id.toString())
      .map(member => 
        Notification.create({
          recipient: member._id,
          sender: req.user._id,
          type: 'COMMUNITY_ITINERARY',
          itinerary: itinerary._id,
          community: community._id,
          isRead: false,
          isSeen: false
        })
      );

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all itineraries for a community
// @route   GET /api/communities/:communityId/itineraries
// @access  Public
router.get('/:communityId/itineraries', async (req, res) => {
  try {
    const itineraries = await CommunityItinerary.find({ community: req.params.communityId })
      .populate('author', 'username avatar')
      .populate('joinedUsers', 'username avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update a community itinerary
// @route   PUT /api/communities/:communityId/itineraries/:itineraryId
// @access  Private (Author only)
router.put('/:communityId/itineraries/:itineraryId', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this itinerary' });
    }

    const updatedItinerary = await CommunityItinerary.findByIdAndUpdate(
      req.params.itineraryId,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username avatar')
     .populate('joinedUsers', 'username avatar');

    res.status(200).json({
      success: true,
      data: updatedItinerary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete a community itinerary
// @route   DELETE /api/communities/:communityId/itineraries/:itineraryId
// @access  Private (Author only)
router.delete('/:communityId/itineraries/:itineraryId', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this itinerary' });
    }

    // Delete the itinerary using findByIdAndDelete
    await CommunityItinerary.findByIdAndDelete(req.params.itineraryId);

    // Remove the itinerary from the community's itineraries array
    await Community.findByIdAndUpdate(
      req.params.communityId,
      { $pull: { itineraries: req.params.itineraryId } }
    );

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Join a community itinerary
// @route   POST /api/communities/:communityId/itineraries/:itineraryId/join
// @access  Private (Community members only)
router.post('/:communityId/itineraries/:itineraryId/join', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member of the community
    const isMember = community.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of the community to join this itinerary' });
    }

    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is already joined
    if (itinerary.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already joined this itinerary' });
    }

    itinerary.joinedUsers.push(req.user._id);
    await itinerary.save();

    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Leave a community itinerary
// @route   POST /api/communities/:communityId/itineraries/:itineraryId/leave
// @access  Private
router.post('/:communityId/itineraries/:itineraryId/leave', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is joined
    if (!itinerary.joinedUsers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not joined to this itinerary' });
    }

    itinerary.joinedUsers = itinerary.joinedUsers.filter(
      userId => userId.toString() !== req.user._id.toString()
    );
    await itinerary.save();

    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 