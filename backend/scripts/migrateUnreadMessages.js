const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const migrateUnreadMessages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all users that don't have unreadMessages field
    const result = await User.updateMany(
      { unreadMessages: { $exists: false } },
      { $set: { unreadMessages: [] } }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrateUnreadMessages(); 