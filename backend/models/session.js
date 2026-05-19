/*
  DEPRECATED: This file uses MongoDB native driver.
  For session management, use Mongoose schemas instead.
  
  Keeping this file as reference for legacy code.
*/

/*
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

// Create a new chat session
async function createSession(userId, subject) {
  try {
    const db = await getDb();
    const session = {
      userId,
      startTime: new Date(),
      lastActive: new Date(),
      subject: subject || 'General',
      device: 'web',
      status: 'active'
    };

    const result = await db.collection('sessions').insertOne(session);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Update the last active time for a session
async function updateSessionActivity(sessionId) {
  try {
    const db = await getDb();
    await db.collection('sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { lastActive: new Date() } }
    );
  } catch (error) {
    console.error('Error updating session activity:', error);
    throw error;
  }
}

module.exports = { createSession, updateSessionActivity };
*/