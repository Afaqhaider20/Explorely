const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'POST_LIKE',
            'POST_COMMENT',
            'COMMENT_LIKE',
            'COMMENT_REPLY',
            'REVIEW_LIKE',
            'REVIEW_COMMENT',
            'REVIEW_COMMENT_LIKE',
            'COMMUNITY_POST',
            'COMMUNITY_ITINERARY'
        ]
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    },
    reviewComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReviewComment'
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    itinerary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityItinerary'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, isSeen: 1 });

// Pre-save middleware to prevent self-notifications
notificationSchema.pre('save', function(next) {
    if (this.recipient.toString() === this.sender.toString()) {
        const error = new Error('Cannot create notification for self-interaction');
        return next(error);
    }
    next();
});

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
    try {
        // Check if notification already exists for this interaction
        const existingNotification = await this.findOne({
            recipient: data.recipient,
            sender: data.sender,
            type: data.type,
            post: data.post,
            comment: data.comment,
            review: data.review,
            reviewComment: data.reviewComment,
            createdAt: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
            }
        });

        if (existingNotification) {
            return null; // Don't create duplicate notifications
        }

        // Create new notification instance to trigger pre-save middleware
        const notification = new this(data);
        return await notification.save();
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    return await this.save();
};

// Method to mark notification as seen
notificationSchema.methods.markAsSeen = async function() {
    this.isSeen = true;
    return await this.save();
};

// Method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );
};

// Method to mark all notifications as seen for a user
notificationSchema.statics.markAllAsSeen = async function(userId) {
    return await this.updateMany(
        { recipient: userId, isSeen: false },
        { isSeen: true }
    );
};

// Method to get unread notification count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false
    });
};

// Method to get unseen notification count for a user
notificationSchema.statics.getUnseenCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isSeen: false
    });
};

// Method to get recent notifications for a user
notificationSchema.statics.getRecentNotifications = async function(userId, limit = 20) {
    return await this.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('post', 'title')
        .populate('comment', 'content')
        .populate('review', 'title')
        .populate('reviewComment', 'content');
};

module.exports = mongoose.model('Notification', notificationSchema); 