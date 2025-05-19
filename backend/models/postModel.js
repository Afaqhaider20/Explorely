const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
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
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    media: {
        type: String
    },
    votes: {
        upvotes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }],
        downvotes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }]
    },
    voteCount: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add text index for search
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Update text index for search to include weights
postSchema.index({ 
    title: 'text', 
    content: 'text'
}, {
    weights: {
        title: 10,
        content: 5
    }
});

// Index for voteCount to improve sorting performance
postSchema.index({ voteCount: -1, createdAt: -1 });

// Remove the virtual definition since we have a real field

// Pre-save middleware to update voteCount
postSchema.pre('save', function(next) {
    if (this.votes) {
        this.voteCount = (this.votes.upvotes?.length || 0) - (this.votes.downvotes?.length || 0);
    }
    next();
});

// Update voteCount after findOneAndUpdate
postSchema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.votes) {
        // Recalculate vote count
        const voteCount = doc.votes.upvotes.length - doc.votes.downvotes.length;
        
        // Update the document if vote count changed
        if (doc.voteCount !== voteCount) {
            doc.voteCount = voteCount;
            await doc.save();
        }
    }
});

// Add post-save middleware to update community
postSchema.post('save', async function(doc) {
    // Update user karma
    const User = mongoose.model('User');
    const author = await User.findById(doc.author);
    if (author) {
        await author.updateKarma();
    }

    // Add post to community
    const Community = mongoose.model('Community');
    const community = await Community.findById(doc.community);
    if (community && !community.posts.includes(doc._id)) {
        community.posts.push(doc._id);
        await community.updatePostCount();
    }
});

// Add pre-remove middleware to clean up community reference
postSchema.pre('remove', async function(next) {
    const Community = mongoose.model('Community');
    await Community.findByIdAndUpdate(this.community, {
        $pull: { posts: this._id }
    });
    next();
});

module.exports = mongoose.model('Post', postSchema);
