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
        // Only log event and IDs for debugging
        console.log('Received send_message event', {
          communityId: data.communityId,
          userId: socket.user._id
        });
        const { content, communityId } = data;

        // Verify user is a member of the community
        const community = await Community.findById(communityId);
        console.log('Found community:', {
          communityId,
          exists: !!community,
          isMember: community ? community.members.includes(socket.user._id) : false
        });

        if (!community || !community.members.includes(socket.user._id)) {
          console.log('User not authorized to send message', {
            userId: socket.user._id,
            communityId
          });
          if (callback) callback(new Error('Not authorized to send messages to this community'));
          return;
        }

        // Create and save the message
        const newMessage = new Message({
          content,
          user: socket.user._id,
          community: communityId,
          timestamp: new Date()
        });

        await newMessage.save();
        console.log('Message saved successfully:', { messageId: newMessage._id });

        // Populate user data for the response
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('user', 'username avatar')
          .lean();

        // Get all members of the community
        const communityMembers = await User.find({ _id: { $in: community.members } });
        console.log('Found community members:', {
          count: communityMembers.length
        });

        // Emit the message to online users in the community room
        io.to(communityId).emit('new_message', populatedMessage);
        console.log('Emitted new_message event to room:', communityId);

        // Update unread messages for offline users and those not in the chat
        const onlineUsersInRoom = Array.from(io.sockets.adapter.rooms.get(communityId) || []);
        console.log('Online users in room:', {
          roomId: communityId,
          count: onlineUsersInRoom.length
        });
        
        // Process all community members for unread updates
        for (const member of communityMembers) {
          const userSocketId = onlineUsers.get(member._id.toString());
          const isInChatRoom = userSocketId && onlineUsersInRoom.includes(userSocketId);
          
          console.log('Processing member for unread count:', {
            userId: member._id.toString(),
            isOnline: !!userSocketId,
            isInChatRoom
          });

          // Skip if user is in the chat room
          if (isInChatRoom) {
            console.log('Skipping unread count for user in chat room:', member._id.toString());
            continue;
          }

          // Get current unread count before update
          const userBeforeUpdate = await User.findById(member._id);
          const currentUnreadCount = userBeforeUpdate.unreadMessages.find(
            msg => msg.community.toString() === communityId
          )?.count || 0;

          console.log('Updating unread count for user:', {
            userId: member._id.toString(),
            communityId,
            currentCount: currentUnreadCount,
            isOnline: !!userSocketId
          });

          // Update unread count
          const updateResult = await User.updateOne(
            { _id: member._id, 'unreadMessages.community': communityId },
            { $inc: { 'unreadMessages.$.count': 1 } }
          );

          if (updateResult.matchedCount === 0) {
            console.log('Creating new unread message entry for user:', {
              userId: member._id.toString(),
              communityId
            });
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
          } else {
            console.log('Updated existing unread count:', {
              userId: member._id.toString(),
              communityId,
              previousCount: currentUnreadCount,
              newCount: currentUnreadCount + 1
            });
          }

          // If user is online, send them the last message update
          if (userSocketId) {
            io.to(userSocketId).emit('unread_last_message_update', {
              communityId,
              lastMessage: {
                _id: populatedMessage._id,
                content: populatedMessage.content,
                timestamp: populatedMessage.timestamp,
                sender: {
                  _id: populatedMessage.user._id,
                  username: populatedMessage.user.username,
                  avatar: populatedMessage.user.avatar
                }
              }
            });
            console.log('Emitted last message update to online user:', userSocketId);
          }
        }

        // Acknowledge successful message sending
        if (callback) callback(null);
      } catch (error) {
        console.error('Error in send_message handler:', error.message);
        if (callback) callback(new Error('Failed to send message'));
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { communityId, isTyping } = data;
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
        socket.emit('error', 'Failed to mark messages as read');
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Get all communities the user is a member of
        const communities = await Community.find({ members: socket.user._id });
        
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
        // Handle error silently
      }

      onlineUsers.delete(socket.user._id.toString());
    });
  });

  return io;
};
