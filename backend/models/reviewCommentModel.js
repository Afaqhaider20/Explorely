const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReviewComment',
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likeCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Update like count before saving
reviewCommentSchema.pre('save', function(next) {
    this.likeCount = this.likes.length;
    next();
});

// Update review's comment count after saving
reviewCommentSchema.post('save', async function() {
    // Only increment comment count if this is a new top-level comment
    if (this.isNew && !this.parentComment) {
        const Review = mongoose.model('Review');
        await Review.findByIdAndUpdate(this.review, {
            $inc: { commentCount: 1 }
        });
    }
});

// Update review's comment count after removing
reviewCommentSchema.post('remove', async function() {
    // Only decrement if this is a top-level comment
    if (!this.parentComment) {
        const Review = mongoose.model('Review');
        await Review.findByIdAndUpdate(this.review, {
            $inc: { commentCount: -1 }
        });
    }
});

module.exports = mongoose.model('ReviewComment', reviewCommentSchema); 