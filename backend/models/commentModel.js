const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxLength: [1000, 'Comment cannot be more than 1000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    level: {
        type: Number,
        default: 1,
        max: [3, 'Comments cannot be nested beyond 3 levels']
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for nested comments
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Pre-save middleware to set comment level
commentSchema.pre('save', async function(next) {
    if (this.parentComment) {
        const parentComment = await this.constructor.findById(this.parentComment);
        if (parentComment) {
            this.level = parentComment.level + 1;
            
            // Check if exceeding max depth
            if (this.level > 3) {
                throw new Error('Comments cannot be nested beyond 3 levels');
            }
        }
    }
    next();
});

// Pre-save middleware to update likeCount
commentSchema.pre('save', function(next) {
    if (this.likes) {
        this.likeCount = this.likes.length;
    }
    next();
});

// Static method to check if a comment can be nested
commentSchema.statics.canNestUnder = async function(parentCommentId) {
    if (!parentCommentId) return true;
    
    const parentComment = await this.findById(parentCommentId);
    if (!parentComment) {
        throw new Error('Parent comment not found');
    }
    
    return parentComment.level < 3;
};

// Update indexes - remove all unique constraints
commentSchema.index({ post: 1, createdAt: -1 }); // For getting comments by post
commentSchema.index({ parentComment: 1, createdAt: 1 }); // For getting replies
commentSchema.index({ likeCount: -1 }); // For sorting by likes
commentSchema.index({ author: 1 }); // For getting user's comments

// Remove any compound indexes

// Update post-save middleware to handle likes instead of votes
commentSchema.post('save', async function(doc) {
    try {
        const User = mongoose.model('User');
        const author = await User.findById(doc.author);
        if (author) {
            await author.updateKarma();
        }
    } catch (error) {
        console.error('Error updating user karma:', error);
    }
});

// Add a pre-remove hook to update karma when comment is deleted
commentSchema.pre('remove', async function(next) {
    try {
        const User = mongoose.model('User');
        const author = await User.findById(this.author);
        if (author) {
            await author.updateKarma();
        }
    } catch (error) {
        console.error('Error updating user karma on comment delete:', error);
    }
    next();
});

module.exports = mongoose.model('Comment', commentSchema);
