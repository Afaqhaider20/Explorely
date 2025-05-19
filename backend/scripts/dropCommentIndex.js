require('dotenv').config();
const mongoose = require('mongoose');
require('../models/commentModel');

async function dropIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Comment = mongoose.model('Comment');
        
        // List all indexes before dropping
        const indexes = await Comment.collection.getIndexes();
        console.log('Current indexes:', indexes);

        // Drop all compound indexes
        const dropPromises = Object.keys(indexes)
            .filter(indexName => 
                indexName !== '_id_' && // Don't drop the _id index
                (indexName.includes('author') || indexName.includes('post'))
            )
            .map(indexName => 
                Comment.collection.dropIndex(indexName)
                    .then(() => console.log(`Dropped index: ${indexName}`))
                    .catch(err => console.log(`Failed to drop ${indexName}:`, err))
            );

        await Promise.all(dropPromises);
        
        // Verify remaining indexes
        const remainingIndexes = await Comment.collection.getIndexes();
        console.log('Remaining indexes:', remainingIndexes);

        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

dropIndexes();
