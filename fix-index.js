// Run this script to fix the accountgstId index
// Usage: node fix-index.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paarshva';

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('customers');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    // Check if accountgstId_1 index exists
    const accountgstIndex = indexes.find(i => i.name === 'accountgstId_1');

    if (accountgstIndex) {
      console.log('Found accountgstId_1 index:', accountgstIndex);

      // Drop the old index
      console.log('Dropping old accountgstId_1 index...');
      await collection.dropIndex('accountgstId_1');
      console.log('Old index dropped successfully');
    }

    // The new sparse unique index will be created automatically when the server restarts
    // But we can create it now
    console.log('Creating new sparse unique index on accountgstId...');
    await collection.createIndex(
      { accountgstId: 1 },
      { unique: true, sparse: true, name: 'accountgstId_1' }
    );
    console.log('New index created successfully!');

    // Verify the new index
    const newIndexes = await collection.indexes();
    const newIndex = newIndexes.find(i => i.name === 'accountgstId_1');
    console.log('New index:', newIndex);

    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixIndex();