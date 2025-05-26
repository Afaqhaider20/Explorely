const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/messageModel');
const User = require('./models/userModel');
const Community = require('./models/communityModel');

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = new Map();

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), socket.id);

    // Join community room
    socket.on('join_community', async (communityId) => {
      try {
        // Verify user is a member of the community
        const community = await Community.findById(communityId);
        if (!community) {
          socket.emit('error', 'Community not found');
          return;
        }

        if (!community.members.includes(socket.user._id)) {
          socket.emit('error', 'Not a member of this community');
          return;
        }

        socket.join(communityId);
        
        // Reset unread count for this community
        await User.findByIdAndUpdate(socket.user._id, {
          $set: {
            'unreadMessages.$[elem].count': 0,
            'unreadMessages.$[elem].lastRead': new Date()
          }
        }, {
          arrayFilters: [{ 'elem.community': communityId }],
          upsert: true,
          new: true
        });
      } catch (error) {
        socket.emit('error', 'Error joining community');
      }
    });

    // Leave community room
    socket.on('leave_community', (communityId) => {
      socket.leave(communityId);
    });

    // Handle new messages
    socket.on('send_message', async (data, callback) => {
      try {
        // Log message event
        console.log(`📨 New message from user ${socket.user.username} in community ${data.communityId}`);

        const { content, communityId, isImage } = data;

        // Verify user is a member of the community
        const community = await Community.findById(communityId);
        if (!community) {
          console.log(`❌ Community ${communityId} not found`);
          if (callback) callback(new Error('Community not found'));
          return;
        }

        if (!community.members.includes(socket.user._id)) {
          console.log(`❌ User ${socket.user.username} is not a member of community ${community.name}`);
          if (callback) callback(new Error('Not authorized to send messages to this community'));
          return;
        }

        // Create and save the message
        const newMessage = new Message({
          content: isImage ? '' : content,
          isImage: isImage || false,
          user: socket.user._id,
          community: communityId,
          timestamp: new Date()
        });

        await newMessage.save();
        console.log(`✅ Message saved successfully (ID: ${newMessage._id})`);

        // Populate user data for the response
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('user', 'username avatar')
          .lean();

        // Get all members of the community
        const communityMembers = await User.find({ _id: { $in: community.members } });
        console.log(`👥 Processing ${communityMembers.length} community members for unread updates`);

        // Emit the message to online users in the community room
        io.to(communityId).emit('new_message', populatedMessage);
        console.log(`📢 Message broadcasted to room ${communityId}`);

        // Process all community members for unread updates
        for (const member of communityMembers) {
          // Skip the sender
          if (member._id.toString() === socket.user._id.toString()) continue;

          const userSocketId = onlineUsers.get(member._id.toString());

          // Get current unread count before update
          const userBeforeUpdate = await User.findById(member._id);
          const currentUnreadCount = userBeforeUpdate.unreadMessages.find(
            msg => msg.community.toString() === communityId
          )?.count || 0;

          // Update unread count
          const updateResult = await User.updateOne(
            { _id: member._id, 'unreadMessages.community': communityId },
            { $inc: { 'unreadMessages.$.count': 1 } }
          );

          if (updateResult.matchedCount === 0) {
            // No matching unreadMessages entry, so push a new one
            await User.updateOne(
              { _id: member._id },
              {
                $push: {
                  unreadMessages: {
                    community: communityId,
                    count: 1,
                    lastRead: new Date()
                  }
                }
              }
            );
          }

          // If user is online, send them the last message update
          if (userSocketId) {
            io.to(userSocketId).emit('unread_last_message_update', {
              communityId,
              lastMessage: {
                _id: populatedMessage._id,
                content: populatedMessage.isImage ? '' : populatedMessage.content,
                timestamp: populatedMessage.timestamp,
                sender: {
                  _id: populatedMessage.user._id,
                  username: populatedMessage.user.username,
                  avatar: populatedMessage.user.avatar
                }
              }
            });
          }
        }

        // Acknowledge successful message sending
        if (callback) callback(null);
      } catch (error) {
        console.error(`❌ Error in send_message handler: ${error.message}`);
        if (callback) callback(new Error('Failed to send message'));
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { communityId, isTyping } = data;
      console.log(`⌨️ ${socket.user.username} is ${isTyping ? 'typing' : 'not typing'} in community ${communityId}`);
      socket.to(communityId).emit('user_typing', {
        userId: socket.user._id,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle marking messages as read
    socket.on('mark_messages_read', async (data) => {
      try {
        const { communityId } = data;
        console.log(`📖 ${socket.user.username} marked messages as read in community ${communityId}`);
        
        // Update the user's last read timestamp and reset unread count
        await User.findOneAndUpdate(
          { 
            _id: socket.user._id,
            'unreadMessages.community': communityId 
          },
          {
            $set: {
              'unreadMessages.$.count': 0,
              'unreadMessages.$.lastRead': new Date()
            }
          },
          { new: true }
        );

        // Broadcast to all connected clients that messages were read
        io.emit('messages_read', { 
          userId: socket.user._id,
          communityId 
        });
      } catch (error) {
        console.error(`❌ Failed to mark messages as read: ${error.message}`);
        socket.emit('error', 'Failed to mark messages as read');
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        console.log(`👋 User ${socket.user.username} disconnected`);
        
        // Get all communities the user is a member of
        const communities = await Community.find({ members: socket.user._id });
        console.log(`📊 Processing ${communities.length} communities for last read updates`);
        
        // For each community, check if there are any new messages since last read
        for (const community of communities) {
          // Get user's last read timestamp for this community
          const user = await User.findById(socket.user._id);
          const lastReadEntry = user.unreadMessages?.find(msg => 
            msg.community.toString() === community._id.toString()
          );
          const lastReadTimestamp = lastReadEntry?.lastRead || new Date(0);

          // Find the most recent message in the community
          const lastMessage = await Message.findOne({ community: community._id })
            .sort({ timestamp: -1 })
            .lean();

          // Only mark as unread if there's a new message after the last read
          if (lastMessage && lastMessage.timestamp > lastReadTimestamp) {
            console.log(`📝 Updating last read timestamp for ${socket.user.username} in community ${community.name}`);
            // Update only this community's lastRead timestamp
            await User.findByIdAndUpdate(socket.user._id, {
              $set: {
                'unreadMessages.$[elem].lastRead': lastMessage.timestamp
              }
            }, {
              arrayFilters: [{ 'elem.community': community._id }],
              upsert: true,
              new: true
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error in disconnect handler: ${error.message}`);
      }

      onlineUsers.delete(socket.user._id.toString());
    });
  });

  return io;
};
