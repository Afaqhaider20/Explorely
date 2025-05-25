const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Check if token is blacklisted
            const isBlacklisted = await TokenBlacklist.findOne({ token });
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Token has been invalidated' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            // Check if user is banned
            if (req.user.isBanned) {
                return res.status(403).json({ message: 'Your account has been banned' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

module.exports = { protect, isAdmin };
