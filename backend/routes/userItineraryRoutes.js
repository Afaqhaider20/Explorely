const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createUserItinerary,
  getUserItineraries,
  getUserItineraryById,
  updateUserItinerary,
  deleteUserItinerary,
  addAccommodation,
  updateAccommodation,
  deleteAccommodation,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addActivity,
  updateActivity,
  deleteActivity
} = require('../controllers/userItineraryController');

router.post('/', protect, createUserItinerary);
router.get('/mine', protect, getUserItineraries);
router.get('/:id', protect, getUserItineraryById);
router.put('/:id', protect, updateUserItinerary);
router.delete('/:id', protect, deleteUserItinerary);

// Activities
router.post('/:id/activities', protect, addActivity);
router.put('/:id/activities/:activityIdx', protect, updateActivity);
router.delete('/:id/activities/:activityIdx', protect, deleteActivity);

// Accommodations
router.post('/:id/accommodations', protect, addAccommodation);
router.put('/:id/accommodations/:accIdx', protect, updateAccommodation);
router.delete('/:id/accommodations/:accIdx', protect, deleteAccommodation);

// Restaurants
router.post('/:id/restaurants', protect, addRestaurant);
router.put('/:id/restaurants/:restIdx', protect, updateRestaurant);
router.delete('/:id/restaurants/:restIdx', protect, deleteRestaurant);

module.exports = router; 