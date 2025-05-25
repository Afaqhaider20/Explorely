const Report = require('../models/reportModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Post = require('../models/postModel');
const Community = require('../models/communityModel');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
    try {
        const { reportedType, reportedItemId, reason } = req.body;

        // Validate the reported item exists
        let itemExists = false;
        switch (reportedType) {
            case 'review':
                itemExists = await Review.findById(reportedItemId);
                break;
            case 'post':
                itemExists = await Post.findById(reportedItemId);
                break;
            case 'user':
                itemExists = await User.findById(reportedItemId);
                break;
            case 'community':
                itemExists = await Community.findById(reportedItemId);
                break;
            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }

        if (!itemExists) {
            return res.status(404).json({ message: 'Reported item not found' });
        }

        // Check if user has already reported this item
        const existingReport = await Report.findOne({
            reporter: req.user._id,
            reportedType,
            [`reported${reportedType.charAt(0).toUpperCase() + reportedType.slice(1)}`]: reportedItemId,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this item' });
        }

        // Create report with the appropriate field based on type
        const reportData = {
            reporter: req.user._id,
            reportedType,
            reason,
            status: 'pending'
        };

        // Set the appropriate reported item field
        const fieldName = `reported${reportedType.charAt(0).toUpperCase() + reportedType.slice(1)}`;
        reportData[fieldName] = reportedItemId;

        // Create the report
        const report = await Report.create(reportData);

        // Populate the report before sending response
        await report.populate([
            { path: 'reporter', select: 'username avatar' },
            { path: 'reportedUser', select: 'username avatar' },
            { path: 'reportedPost', select: 'title' },
            { path: 'reportedReview', select: 'title' },
            { path: 'reportedCommunity', select: 'name' }
        ]);

        res.status(201).json(report);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all reports (admin only)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (type) query.reportedType = type;

        const reports = await Report.find(query)
            .populate({
                path: 'reporter',
                select: 'username avatar',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        username: doc.username,
                        avatar: doc.avatar
                    };
                }
            })
            .populate({
                path: 'reportedUser',
                select: 'username bio',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        username: doc.username,
                        bio: doc.bio || ''
                    };
                }
            })
            .populate({
                path: 'reportedPost',
                select: 'title description content',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        title: doc.title,
                        content: doc.content || ''
                    };
                }
            })
            .populate({
                path: 'reportedReview',
                select: 'title content',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        title: doc.title,
                        content: doc.content || ''
                    };
                }
            })
            .populate({
                path: 'reportedCommunity',
                select: 'name description',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        name: doc.name,
                        description: doc.description || ''
                    };
                }
            })
            .populate({
                path: 'resolvedBy',
                select: 'username avatar',
                transform: doc => {
                    if (!doc) return null;
                    return {
                        _id: doc._id,
                        username: doc.username,
                        avatar: doc.avatar
                    };
                }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Transform the reports to match frontend type definition
        const transformedReports = reports.map(report => {
            const transformed = report.toObject();
            
            // Remove extra fields added by Mongoose
            delete transformed.id;
            delete transformed.__v;
            
            return transformed;
        });

        const total = await Report.countDocuments(query);

        res.json({
            reports: transformedReports,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalReports: total
        });
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get reports for a specific item
// @route   GET /api/reports/item/:type/:id
// @access  Private/Admin
const getItemReports = async (req, res) => {
    try {
        const { type, id } = req.params;
        const query = {
            reportedType: type,
            [`reported${type.charAt(0).toUpperCase() + type.slice(1)}`]: id
        };

        const reports = await Report.find(query)
            .populate('reporter', 'username avatar')
            .populate('reportedUser', 'username avatar')
            .populate('reportedPost', 'title')
            .populate('reportedReview', 'title')
            .populate('reportedCommunity', 'name')
            .populate('resolvedBy', 'username avatar');

        res.json(reports);
    } catch (error) {
        console.error('Error getting item reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update report status
// @route   PATCH /api/reports/:id/status
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status;
        report.adminNotes = adminNotes;
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();

        await report.save();

        // Populate the report before sending response
        await report.populate([
            { path: 'reporter', select: 'username avatar' },
            { path: 'reportedUser', select: 'username avatar' },
            { path: 'reportedPost', select: 'title' },
            { path: 'reportedReview', select: 'title' },
            { path: 'reportedCommunity', select: 'name' },
            { path: 'resolvedBy', select: 'username avatar' }
        ]);

        res.json(report);
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's reports
// @route   GET /api/reports/user
// @access  Private
const getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporter: req.user._id })
            .populate('reportedUser', 'username avatar')
            .populate('reportedPost', 'title')
            .populate('reportedReview', 'title')
            .populate('reportedCommunity', 'name')
            .populate('resolvedBy', 'username avatar');
        res.json(reports);
    } catch (error) {
        console.error('Error getting user reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createReport,
    getReports,
    getItemReports,
    updateReportStatus,
    getUserReports
}; 