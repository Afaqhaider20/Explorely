const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

async function updateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all users that don't have isBanned field
    const result = await User.updateMany(
      { isBanned: { $exists: false } },
      { $set: { isBanned: false } }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateUsers(); 