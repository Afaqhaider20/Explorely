const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/messageModel');
const User = require('./models/userModel');

module.exports = (server) => {
    const io = socketio(server, {
        cors: { 
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication token is required'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            // Store user data in socket for later use
            socket.user = {
                _id: user._id,
                username: user.username,
                avatar: user.avatar
            };
            
            next();
        } catch (error) {
            return next(new Error('Authentication failed'));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // Join a channel room
        socket.on("joinChannel", ({ channelId }) => {
            if (!channelId) return;
            
            socket.join(channelId);
            console.log(`${socket.user.username} joined channel: ${channelId}`);
        });

        // Leave a channel room
        socket.on("leaveChannel", ({ channelId }) => {
            if (!channelId) return;
            
            socket.leave(channelId);
            console.log(`${socket.user.username} left channel: ${channelId}`);
        });

        // Send a message
        socket.on("sendMessage", async ({ communityId, channelId, content }) => {
            try {
                if (!communityId || !channelId || !content || content.trim() === '') {
                    return socket.emit("error", { message: "Invalid message data" });
                }

                // Create message in database
                const message = await Message.create({
                    community: communityId,
                    channelId,
                    sender: socket.user._id,
                    content
                });

                // Populate sender info for the response
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username avatar')
                    .lean();

                // Emit to everyone in the channel (including sender)
                io.to(channelId).emit("newMessage", populatedMessage);
                
            } catch (error) {
                console.error("Message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Typing indicator
        socket.on("typing", ({ channelId, isTyping }) => {
            if (!channelId) return;
            
            // Notify all users in the channel except the sender
            socket.to(channelId).emit("userTyping", {
                user: socket.user.username,
                isTyping
            });
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user?.username || 'Unknown'}`);
            // Socket.io automatically handles leaving rooms on disconnect
        });
    });

    return io;
};
