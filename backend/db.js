/*
  DEPRECATED: This file uses MongoDB native driver.
  The application now uses Mongoose for all database operations.
  See backend/Message.js for the Mongoose schema.
  
  Keeping this file as reference for legacy code.
*/

/*
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/brainbytes';

async function connectWithRetry() {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const client = await MongoClient.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10  // Connection pooling
      });
      console.log('Connected to MongoDB');
      return client.db();
    } catch (err) {
      console.error(`MongoDB connection attempt ${retries + 1} failed:`, err);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }

  console.error('Could not connect to MongoDB. Max retries reached.');
  process.exit(1);
}

// Create database indexes for performance
async function createIndexes(db) {
  try {
    await db.collection('messages').createIndex({ sessionId: 1, timestamp: 1 });
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ lastActive: 1 });
    console.log('Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

let db;
async function getDb() {
  if (!db) {
    db = await connectWithRetry();
    await createIndexes(db);
  }
  return db;
}

module.exports = { getDb, connectWithRetry };
*/
