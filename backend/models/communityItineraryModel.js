const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  date: { type: Date },
  notes: { type: String }
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  date: { type: Date },
  notes: { type: String }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date },
  notes: { type: String }
}, { _id: false });

const communityItinerarySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  destination: { type: String, required: true, trim: true, maxlength: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: String, required: true },
  travelers: { type: Number, required: true, min: 1 },
  description: { type: String, maxlength: 1000 },
  activities: [activitySchema],
  accommodations: [accommodationSchema],
  restaurants: [restaurantSchema],
  status: {
    type: String,
    enum: ['upcoming', 'planning', 'completed'],
    default: 'upcoming'
  },
  progress: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  joinedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  coverImage: { type: String }
}, { timestamps: true });

// Pre-save middleware to automatically set status based on end date
communityItinerarySchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'completed';
  } else if (this.status === 'planning') {
    this.status = 'upcoming';
  }
  next();
});

module.exports = mongoose.model('CommunityItinerary', communityItinerarySchema); 