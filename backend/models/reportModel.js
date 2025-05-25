const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedType: {
        type: String,
        required: true,
        enum: ['review', 'post', 'user', 'community']
    },
    // Separate fields for each type of reported item
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    reportedReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    },
    reportedCommunity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'Harassment or bullying',
            'Hate speech or symbols',
            'Misinformation',
            'Spam',
            'Inappropriate content'
        ]
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for faster queries
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

// Virtual to get the reported item based on type
reportSchema.virtual('reportedItem').get(function() {
    switch(this.reportedType) {
        case 'user': return this.reportedUser;
        case 'post': return this.reportedPost;
        case 'review': return this.reportedReview;
        case 'community': return this.reportedCommunity;
        default: return null;
    }
});

// Pre-save middleware to ensure only one reported item is set
reportSchema.pre('save', function(next) {
    const reportedFields = [
        'reportedUser',
        'reportedPost',
        'reportedReview',
        'reportedCommunity'
    ];
    
    const setFields = reportedFields.filter(field => this[field]);
    
    if (setFields.length !== 1) {
        return next(new Error('Exactly one reported item must be set'));
    }
    
    next();
});

// Method to get all reports for a specific item
reportSchema.statics.getReportsForItem = async function(type, itemId) {
    return await this.find({
        reportedType: type,
        [`reported${type.charAt(0).toUpperCase() + type.slice(1)}`]: itemId
    }).populate('reporter', 'username avatar');
};

// Method to get all reports for a specific user
reportSchema.statics.getReportsByUser = async function(userId) {
    return await this.find({
        reporter: userId
    }).populate('reportedItem');
};

// Method to get all pending reports
reportSchema.statics.getPendingReports = async function() {
    return await this.find({
        status: 'pending'
    }).populate('reporter', 'username avatar');
};

module.exports = mongoose.model('Report', reportSchema); 