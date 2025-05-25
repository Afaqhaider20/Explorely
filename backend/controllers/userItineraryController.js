const UserItinerary = require('../models/userItineraryModel');

exports.createUserItinerary = async (req, res) => {
  try {
    const itinerary = await UserItinerary.create({ ...req.body, user: req.user._id });
    res.status(201).json({ status: 'success', data: { itinerary } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getUserItineraries = async (req, res) => {
  try {
    const itineraries = await UserItinerary.find({ user: req.user._id }).sort({ startDate: 1 });
    res.json({ status: 'success', data: { itineraries } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getUserItineraryById = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    res.json({ status: 'success', data: { itinerary } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateUserItinerary = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    res.json({ status: 'success', data: { itinerary } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.deleteUserItinerary = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    res.json({ status: 'success', data: null });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Add Accommodation
exports.addAccommodation = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.accommodations.push(req.body);
    await itinerary.save();
    res.json({ status: 'success', data: { accommodations: itinerary.accommodations } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Update Accommodation
exports.updateAccommodation = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    const idx = itinerary.accommodations.findIndex((a, i) => i === Number(req.params.accIdx));
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'Accommodation not found' });
    itinerary.accommodations[idx] = { ...itinerary.accommodations[idx], ...req.body };
    await itinerary.save();
    res.json({ status: 'success', data: { accommodation: itinerary.accommodations[idx] } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Delete Accommodation
exports.deleteAccommodation = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.accommodations.splice(Number(req.params.accIdx), 1);
    await itinerary.save();
    res.json({ status: 'success', data: { accommodations: itinerary.accommodations } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Add Restaurant
exports.addRestaurant = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.restaurants.push(req.body);
    await itinerary.save();
    res.json({ status: 'success', data: { restaurants: itinerary.restaurants } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Update Restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    const idx = itinerary.restaurants.findIndex((r, i) => i === Number(req.params.restIdx));
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'Restaurant not found' });
    itinerary.restaurants[idx] = { ...itinerary.restaurants[idx], ...req.body };
    await itinerary.save();
    res.json({ status: 'success', data: { restaurant: itinerary.restaurants[idx] } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Delete Restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.restaurants.splice(Number(req.params.restIdx), 1);
    await itinerary.save();
    res.json({ status: 'success', data: { restaurants: itinerary.restaurants } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Add Activity
exports.addActivity = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.activities.push(req.body);
    await itinerary.save();
    res.json({ status: 'success', data: { activities: itinerary.activities } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Update Activity
exports.updateActivity = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    const idx = itinerary.activities.findIndex((a, i) => i === Number(req.params.activityIdx));
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'Activity not found' });
    itinerary.activities[idx] = { ...itinerary.activities[idx], ...req.body };
    await itinerary.save();
    res.json({ status: 'success', data: { activity: itinerary.activities[idx] } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Delete Activity
exports.deleteActivity = async (req, res) => {
  try {
    const itinerary = await UserItinerary.findOne({ _id: req.params.id, user: req.user._id });
    if (!itinerary) return res.status(404).json({ status: 'error', message: 'Itinerary not found' });
    itinerary.activities.splice(Number(req.params.activityIdx), 1);
    await itinerary.save();
    res.json({ status: 'success', data: { activities: itinerary.activities } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
}; 