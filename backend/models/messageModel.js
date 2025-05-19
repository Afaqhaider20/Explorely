const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxLength: [2000, 'Message cannot be more than 2000 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ community: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
