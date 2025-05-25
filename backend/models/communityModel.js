const mongoose = require('mongoose');

// Rules sub-schema
const ruleSchema = new mongoose.Schema({
    order: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: [true, 'Rule content is required'],
        trim: true,
        maxLength: [500, 'Rule content cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a community name'],
        unique: true,
        trim: true,
        maxLength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxLength: [1000, 'Description cannot be more than 1000 characters']
    },
    avatar: {
        type: String,
        default: 'default-community.png'
    },
    banner: {
        type: String,
        default: 'default-banner.png'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rules: [ruleSchema],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    itineraries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityItinerary'
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            if (ret.id) delete ret.id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for member count
communitySchema.virtual('memberCount').get(function() {
    return this.members ? this.members.length : 0;
});

// Update text index for search with weights
communitySchema.index({ 
    name: 'text', 
    description: 'text' 
}, {
    weights: {
        name: 10,
        description: 5
    }
});

// Add method to update post count
communitySchema.methods.updatePostCount = async function() {
    this.postCount = this.posts.length;
    await this.save();
};

// Pre-save middleware to ensure a default "general" channel exists
communitySchema.pre('save', function(next) {
    if (this.isNew && (!this.channels || this.channels.length === 0)) {
        this.channels = [{
            _id: new mongoose.Types.ObjectId(),
            channelName: 'general',
            createdBy: this.creator,
            createdAt: new Date()
        }];
    }
    next();
});

module.exports = mongoose.model('Community', communitySchema);
