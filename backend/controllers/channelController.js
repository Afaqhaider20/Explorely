const Community = require('../models/communityModel');
const Message = require('../models/messageModel');
const mongoose = require('mongoose');

// Create a new channel (admin only)
const createChannel = async (req, res) => {
    try {
        const { communityId } = req.params;
        const { channelName } = req.body;
        const userId = req.user._id;

        // Validate channel name
        if (!channelName || channelName.trim() === '') {
            return res.status(400).json({ message: 'Channel name is required' });
        }

        // Find the community
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is the creator/admin of the community
        if (community.creator.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only community creators can add channels' });
        }

        // Check if channel name already exists
        const channelExists = community.channels.some(
            channel => channel.channelName.toLowerCase() === channelName.toLowerCase()
        );

        if (channelExists) {
            return res.status(400).json({ message: 'Channel with this name already exists' });
        }

        // Create a new channel
        const newChannel = {
            _id: new mongoose.Types.ObjectId(),
            channelName,
            createdBy: userId,
            createdAt: new Date()
        };

        // Add channel to community
        community.channels.push(newChannel);
        await community.save();

        res.status(201).json({
            status: 'success',
            data: { channel: newChannel }
        });
    } catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all channels for a community
const getChannels = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Find the community
        const community = await Community.findById(communityId)
            .populate({
                path: 'channels.createdBy',
                select: 'username avatar'
            });

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.json({
            status: 'success',
            data: { channels: community.channels || [] }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages for a channel
const getChannelMessages = async (req, res) => {
    try {
        const { communityId, channelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Find the community and check if channel exists
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const channelExists = community.channels.some(
            channel => channel._id.toString() === channelId
        );

        if (!channelExists) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        // Get messages for this channel
        const messages = await Message.find({ communityId, channelId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'username avatar')
            .lean();

        // Get total count for pagination
        const totalMessages = await Message.countDocuments({ communityId, channelId });

        res.json({
            status: 'success',
            data: {
                messages: messages.reverse(), // Send in chronological order
                page,
                limit,
                total: totalMessages,
                hasMore: totalMessages > skip + messages.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createChannel,
    getChannels,
    getChannelMessages
};
