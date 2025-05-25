const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    karma: {
        total: { 
            type: Number, 
            default: 0 
        },
        postKarma: { 
            type: Number, 
            default: 0 
        },
        commentKarma: { 
            type: Number, 
            default: 0 
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    },
    bio: {
        type: String,
        default: "New traveler exploring the world with Explorely!",
        maxLength: [500, 'Bio cannot be more than 500 characters']
    },
    joinedCommunities: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Community'
        }],
        default: []
    },
    recommendationKeywords: {
        type: [String],
        default: []
    },
    unreadMessages: [{
        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Community',
            required: true
        },
        count: {
            type: Number,
            default: 0
        },
        lastRead: {
            type: Date,
            default: Date.now
        }
    }],
    notificationSettings: {
        postLikes: { type: Boolean, default: true },
        commentLikes: { type: Boolean, default: true },
        commentReplies: { type: Boolean, default: true },
        reviewLikes: { type: Boolean, default: true },
        reviewComments: { type: Boolean, default: true },
        reviewCommentLikes: { type: Boolean, default: true }
    },
    lastNotificationCheck: {
        type: Date,
        default: Date.now
    },
    unseenNotificationCount: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.joinedCommunities = ret.joinedCommunities || [];
            delete ret.password;
            return ret;
        }
    },
    toObject: { virtuals: true },
    index: {
        'unreadMessages.community': 1,
        'unreadMessages.lastRead': 1
    }
});

// Virtual for notifications
userSchema.virtual('notifications', {
    ref: 'Notification',
    localField: '_id',
    foreignField: 'recipient'
});

// Method to update karma when a post/comment gets voted
userSchema.methods.updateKarma = async function() {
    // Get all posts by user
    const Post = mongoose.model('Post');
    const Comment = mongoose.model('Comment');
    
    const [posts, comments] = await Promise.all([
        Post.find({ author: this._id }),
        Comment.find({ author: this._id })
    ]);

    // Calculate karma from posts (using votes)
    const postKarma = posts.reduce((total, post) => {
        return total + (post.voteCount || 0);
    }, 0);

    // Calculate karma from comments (using likes)
    const commentKarma = comments.reduce((total, comment) => {
        return total + (comment.likeCount || 0);
    }, 0);

    // Update user's karma with proper structure
    this.karma = {
        total: postKarma + commentKarma,
        postKarma: postKarma,
        commentKarma: commentKarma,
        lastCalculated: new Date()
    };
    
    await this.save();
    return this.karma.total;
};

// Method to get unread notification count
userSchema.methods.getUnreadNotificationCount = async function() {
    const Notification = mongoose.model('Notification');
    return await Notification.getUnreadCount(this._id);
};

// Method to get unseen notification count
userSchema.methods.getUnseenNotificationCount = async function() {
    const Notification = mongoose.model('Notification');
    const count = await Notification.getUnseenCount(this._id);
    this.unseenNotificationCount = count;
    await this.save();
    return count;
};

// Method to mark all notifications as read
userSchema.methods.markAllNotificationsAsRead = async function() {
    const Notification = mongoose.model('Notification');
    await Notification.markAllAsRead(this._id);
    this.lastNotificationCheck = new Date();
    await this.save();
};

// Method to mark all notifications as seen
userSchema.methods.markAllNotificationsAsSeen = async function() {
    const Notification = mongoose.model('Notification');
    await Notification.markAllAsSeen(this._id);
    this.unseenNotificationCount = 0;
    this.lastNotificationCheck = new Date();
    await this.save();
};

// Method to get recent notifications
userSchema.methods.getRecentNotifications = async function(limit = 20) {
    const Notification = mongoose.model('Notification');
    return await Notification.getRecentNotifications(this._id, limit);
};

// Method to check if user should receive a notification type
userSchema.methods.shouldReceiveNotification = function(type) {
    const typeMap = {
        'POST_LIKE': 'postLikes',
        'COMMENT_LIKE': 'commentLikes',
        'COMMENT_REPLY': 'commentReplies',
        'REVIEW_LIKE': 'reviewLikes',
        'REVIEW_COMMENT': 'reviewComments',
        'REVIEW_COMMENT_LIKE': 'reviewCommentLikes'
    };

    return this.notificationSettings[typeMap[type]] !== false;
};

// Method to increment unseen notification count
userSchema.methods.incrementUnseenNotificationCount = async function() {
    this.unseenNotificationCount += 1;
    await this.save();
};

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
