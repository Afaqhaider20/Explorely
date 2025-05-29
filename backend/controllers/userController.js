const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Post = require('../models/postModel'); // Add this import
const Comment = require('../models/commentModel'); // Add this import
const TokenBlacklist = require('../models/tokenBlacklistModel');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Register new user
const registerUser = async (req, res) => {
    try {
        const { username, name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (userExists) {
            return res.status(400).json({ 
                message: userExists.email === email 
                    ? 'Email already exists' 
                    : 'Username already taken' 
            });
        }

        // Create user - password will be hashed by the pre-save middleware
        const user = await User.create({
            username,
            name,
            email,
            password,
            bio: "New traveler exploring the world with Explorely!"
        });

        // Verify the stored password
        const storedUser = await User.findById(user._id);
        const passwordVerification = await storedUser.matchPassword(password);
        
        if (!passwordVerification) {
            await User.findByIdAndDelete(user._id);
            throw new Error('Password verification failed after storage');
        }

        const populatedUser = await User.findById(user._id)
            .select('username email avatar bio joinedCommunities')
            .populate('joinedCommunities', 'name avatar')
            .lean();

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    _id: populatedUser._id,
                    username: populatedUser.username,
                    email: populatedUser.email,
                    avatar: populatedUser.avatar,
                    joinedCommunities: populatedUser.joinedCommunities || []
                },
                token: generateToken(populatedUser._id)
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user) {
            const isPasswordValid = await user.matchPassword(password);

            if (isPasswordValid) {
                // Check if user is banned
                if (user.isBanned) {
                    return res.status(403).json({ 
                        message: 'Your account has been banned. Please contact support for more information.' 
                    });
                }

                const populatedUser = await User.findById(user._id)
                    .select('username email avatar bio joinedCommunities')
                    .populate('joinedCommunities', 'name avatar')
                    .lean();

                res.status(200).json({
                    status: 'success',
                    data: {
                        user: {
                            _id: populatedUser._id,
                            username: populatedUser.username,
                            email: populatedUser.email,
                            avatar: populatedUser.avatar,
                            joinedCommunities: populatedUser.joinedCommunities || []
                        },
                        token: generateToken(user._id)
                    }
                });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password') 
            .populate({
                path: 'joinedCommunities',
                select: 'name description members avatar',
                populate: {
                    path: 'members',
                    select: 'username avatar' // Ensure no passwords in members
                }
            })
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.bio) {
            const defaultBio = "New traveler exploring the world with Explorely!";
            // Update the database with the default bio
            await User.findByIdAndUpdate(user._id, { bio: defaultBio });
            user.bio = defaultBio;
        }

        // Get user's posts
        const posts = await Post.find({ author: user._id })
            .select('title content media voteCount createdAt updatedAt')
            .populate('community', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Add comment count to each post
        const postsWithCommentCount = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount
            };
        }));

        // Format communities
        const formattedCommunities = user.joinedCommunities.map(community => ({
            _id: community._id,
            name: community.name,
            description: community.description,
            avatar: community.avatar,
            members: community.members,
            memberCount: community.members.length
        }));

        // Format user data - explicitly remove password if it somehow made it through
        const { password, ...userWithoutPassword } = user;
        
        const userData = {
            ...userWithoutPassword,
            joinedCommunities: formattedCommunities,
            posts: postsWithCommentCount
        };

        res.json(userData);
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: error.message });
    }
};

// Logout user
const logoutUser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        
        // Calculate token expiry from JWT
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        // Add token to blacklist
        await TokenBlacklist.create({
            token,
            expiresAt
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

// Combined update profile function
const updateProfile = async (req, res) => {
    try {
        const { username, bio } = req.body;
        const updateData = {};
        
        // Validate username if provided
        if (username) {
            // Check if username is already taken
            const existingUser = await User.findOne({ 
                username, 
                _id: { $ne: req.user._id } 
            });
            
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            
            updateData.username = username;
        }
        
        // Validate bio if provided
        if (bio !== undefined) {
            if (bio.length > 500) {
                return res.status(400).json({ message: 'Bio cannot be more than 500 characters' });
            }
            updateData.bio = bio;
        }
        
        // Handle avatar update
        if (req.file) {
            updateData.avatar = await uploadToCloudinary(req.file, 'explorely/avatars');
        }
        
        // Return error if no fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password');
        
        res.json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user profile by ID
const getProfileById = async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const user = await User.findById(req.params.id)
            .select('-password') 
            .populate({
                path: 'joinedCommunities',
                select: 'name description members avatar',
                populate: {
                    path: 'members',
                    select: 'username avatar'
                }
            })
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's posts
        const posts = await Post.find({ author: user._id })
            .select('title content media voteCount createdAt updatedAt')
            .populate('community', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Add comment count to each post
        const postsWithCommentCount = await Promise.all(posts.map(async post => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post,
                commentCount
            };
        }));

        // Format communities
        const formattedCommunities = user.joinedCommunities.map(community => ({
            _id: community._id,
            name: community.name,
            description: community.description,
            avatar: community.avatar,
            members: community.members,
            memberCount: community.members.length
        }));

        // Format user data
        const { password, ...userWithoutPassword } = user;
        
        const userData = {
            ...userWithoutPassword,
            joinedCommunities: formattedCommunities,
            posts: postsWithCommentCount
        };

        res.json(userData);
    } catch (error) {
        console.error('Error getting profile by ID:', error);
        // Check if it's a MongoDB error
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        // Get the current token from the cookie
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the current token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get the user
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ 
                message: 'Your account has been banned. Please contact support for more information.' 
            });
        }

        // Generate new token
        const newToken = generateToken(user._id);

        // Set the new token in cookie
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({ token: newToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
    updateProfile,
    getProfileById,
    refreshToken,
    generateToken
};
