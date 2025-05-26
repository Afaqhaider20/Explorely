const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    trim: true,
    default: '',
  },
  image: {
    type: String, // This will store the Cloudinary image URL
    default: '',
  },
  isImage: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ community: 1, timestamp: -1 });

// Add text index for search functionality
messageSchema.index({ content: 'text' });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
