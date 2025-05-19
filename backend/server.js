require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Import all models first
require('./models/userModel');
require('./models/communityModel');
require('./models/postModel');
require('./models/commentModel');
require('./models/tokenBlacklistModel');

// Verify environment variables
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables');
    process.exit(1);
}

const app = express();

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes); // Mount comment routes
app.use("/api/search", require('./routes/searchRoutes'));

// Create HTTP server (needed for socket.io)
const server = require('http').createServer(app);

// Initialize socket.io
const io = require('./socket')(server);

// Use channel routes
const channelRoutes = require('./routes/channelRoutes');
app.use('/api', channelRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
