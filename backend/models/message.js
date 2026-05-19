/*
  DEPRECATED: This file uses MongoDB native driver.
  Use backend/Message.js (Mongoose schema) instead.
  
  Keeping this file as reference for legacy code.
*/

/*
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

// Validate message data
function validateMessage(message) {
  if (!message.text || typeof message.text !== 'string') {
    throw new Error('Message text is required and must be a string');
  }

  if (!['user', 'ai'].includes(message.sender)) {
    throw new Error('Sender must be either "user" or "ai"');
  }

  if (!message.sessionId) {
    throw new Error('Session ID is required');
  }

  return true;
}

// Save a new message
async function saveMessage(message) {
  try {
    validateMessage(message);
    
    const db = await getDb();
    const result = await db.collection('messages').insertOne({
      text: message.text,
      sender: message.sender,
      sessionId: message.sessionId,
      timestamp: new Date(),
      metadata: message.metadata || {}
    });

    return result.insertedId;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

// Get message history for a session with pagination
async function getMessageHistory(sessionId, limit = 50, offset = 0) {
  try {
    const db = await getDb();
    
    // Get messages
    const messages = await db.collection('messages')
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection('messages').countDocuments({ sessionId });

    return {
      messages,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error retrieving message history:', error);
    throw error;
  }
}

module.exports = { saveMessage, getMessageHistory, validateMessage };