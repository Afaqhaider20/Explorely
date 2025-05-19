const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];

            // Check if token is blacklisted
            const isBlacklisted = await TokenBlacklist.findOne({ token });
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Token has been invalidated' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } else {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Not authorized' });
    }
};

module.exports = { protect };
