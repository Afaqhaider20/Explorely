const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
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
        default: []  // Add this default value
    },
    isAdmin: {
        type: Boolean,
        default: false
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
    toObject: { virtuals: true }
});

// Method to update karma when a post/comment gets voted
// Update karma calculation to handle the new karma structure
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

module.exports = mongoose.model('User', userSchema);
