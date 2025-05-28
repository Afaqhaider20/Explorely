const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxLength: [300, 'Title cannot be more than 300 characters']
    },
    content: {
        type: String,
        required: [true, 'Please add content'],
        maxLength: [40000, 'Content cannot be more than 40000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location'],
        trim: true
    },
    userCity: {
        type: String,
        trim: true
    },
    userCountry: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Restaurant', 'Hotel', 'Attraction']
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    images: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add text index for search
reviewSchema.index({ 
    title: 'text', 
    content: 'text',
    location: 'text'
}, {
    weights: {
        title: 10,
        content: 5,
        location: 8
    }
});

// Index for sorting by popularity and recency
reviewSchema.index({ likeCount: -1, createdAt: -1 });

// Pre-save middleware to update likeCount
reviewSchema.pre('save', function(next) {
    this.likeCount = this.likes.length;
    next();
});

// Add post-save middleware to update user karma
reviewSchema.post('save', async function(doc) {
    const User = mongoose.model('User');
    const author = await User.findById(doc.author);
    if (author) {
        await author.updateKarma();
    }
});

module.exports = mongoose.model('Review', reviewSchema); 