require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import routes
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userItineraryRoutes = require('./routes/userItineraryRoutes');
const communityItineraryRoutes = require('./routes/communityItineraries');
const communityItineraryDetailsRoutes = require('./routes/communityItineraryDetails');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import all models first
require('./models/userModel');
require('./models/communityModel');
require('./models/postModel');
require('./models/commentModel');
require('./models/tokenBlacklistModel');
require('./models/messageModel');
require('./models/communityItineraryModel');
require('./models/reviewModel');
require('./models/reviewCommentModel');
require('./models/notificationModel');
require('./models/userItineraryModel');
require('./models/reportModel');

// Verify environment variables
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables');
    process.exit(1);
}

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api/search", require('./routes/searchRoutes'));
app.use("/api/messages", messageRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/useritineraries', userItineraryRoutes);
app.use('/api/communities', communityItineraryRoutes);
app.use('/api/community-itineraries', communityItineraryDetailsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Create HTTP server (needed for socket.io)
const server = require('http').createServer(app);

// Initialize socket.io
const io = require('./socket')(server);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
    console.log(err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
