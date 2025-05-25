const express = require('express');
const router = express.Router();
const CommunityItinerary = require('../models/communityItineraryModel');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get a single community itinerary
// @route   GET /api/community-itineraries/:communityId/:itineraryId
// @access  Public
router.get('/:communityId/:itineraryId', async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId)
      .populate('author', 'username avatar')
      .populate('joinedUsers', 'username avatar');

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

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

// @desc    Add an activity to itinerary
// @route   POST /api/community-itineraries/:communityId/:itineraryId/activities
// @access  Private (Author only)
router.post('/:communityId/:itineraryId/activities', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add activities' });
    }

    itinerary.activities.push(req.body);
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

// @desc    Delete an activity from itinerary
// @route   DELETE /api/community-itineraries/:communityId/:itineraryId/activities/:activityIndex
// @access  Private (Author only)
router.delete('/:communityId/:itineraryId/activities/:activityIndex', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete activities' });
    }

    const activityIndex = parseInt(req.params.activityIndex);
    if (activityIndex < 0 || activityIndex >= itinerary.activities.length) {
      return res.status(400).json({ message: 'Invalid activity index' });
    }

    itinerary.activities.splice(activityIndex, 1);
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

// @desc    Add an accommodation to itinerary
// @route   POST /api/community-itineraries/:communityId/:itineraryId/accommodations
// @access  Private (Author only)
router.post('/:communityId/:itineraryId/accommodations', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add accommodations' });
    }

    itinerary.accommodations.push(req.body);
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

// @desc    Delete an accommodation from itinerary
// @route   DELETE /api/community-itineraries/:communityId/:itineraryId/accommodations/:accommodationIndex
// @access  Private (Author only)
router.delete('/:communityId/:itineraryId/accommodations/:accommodationIndex', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete accommodations' });
    }

    const accommodationIndex = parseInt(req.params.accommodationIndex);
    if (accommodationIndex < 0 || accommodationIndex >= itinerary.accommodations.length) {
      return res.status(400).json({ message: 'Invalid accommodation index' });
    }

    itinerary.accommodations.splice(accommodationIndex, 1);
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

// @desc    Add a restaurant to itinerary
// @route   POST /api/community-itineraries/:communityId/:itineraryId/restaurants
// @access  Private (Author only)
router.post('/:communityId/:itineraryId/restaurants', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add restaurants' });
    }

    itinerary.restaurants.push(req.body);
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

// @desc    Delete a restaurant from itinerary
// @route   DELETE /api/community-itineraries/:communityId/:itineraryId/restaurants/:restaurantIndex
// @access  Private (Author only)
router.delete('/:communityId/:itineraryId/restaurants/:restaurantIndex', protect, async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId);
    
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if user is the author
    if (itinerary.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete restaurants' });
    }

    const restaurantIndex = parseInt(req.params.restaurantIndex);
    if (restaurantIndex < 0 || restaurantIndex >= itinerary.restaurants.length) {
      return res.status(400).json({ message: 'Invalid restaurant index' });
    }

    itinerary.restaurants.splice(restaurantIndex, 1);
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

// @desc    Get joined users for an itinerary
// @route   GET /api/community-itineraries/:communityId/:itineraryId/joined-users
// @access  Public
router.get('/:communityId/:itineraryId/joined-users', async (req, res) => {
  try {
    const itinerary = await CommunityItinerary.findById(req.params.itineraryId)
      .populate('joinedUsers', 'username avatar _id')
      .select('joinedUsers');

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        joinedUsers: itinerary.joinedUsers,
        count: itinerary.joinedUsers.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 