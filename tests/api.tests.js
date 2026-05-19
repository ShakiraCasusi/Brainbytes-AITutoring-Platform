const axios = require('axios');
const { MongoClient } = require('mongodb');

// Legacy fixed local endpoints:
// const API_BASE_URL = 'http://localhost:4000';
// const MONGO_URI = 'mongodb://localhost:27017/brainbytes';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brainbytes_test';

describe('API Communication Tests', () => {
  let mongoClient;
  let db;
  
  beforeAll(async () => {
    // Connect to MongoDB for test verification
    mongoClient = await MongoClient.connect(MONGO_URI);
    db = mongoClient.db();
  });
  
  afterAll(async () => {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
    }
  });
  
  test('Backend health check is accessible', async () => {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
    expect(response.data.databaseConnected).toBe(true);
  });
  
  test('Chat API can save messages to database', async () => {
    // Send a test message
    const testMessage = {
      text: 'Test message ' + Date.now(),
      sender: 'user',
      sessionId: 'test-session-' + Date.now(),
      metadata: {}
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/chat/message`, testMessage);
    expect(response.status).toBe(200);
    expect(response.data.messageId).toBeDefined();
    
    // Verify message was saved to database
    const savedMessage = await db.collection('messages')
      .findOne({ 
        text: testMessage.text,
        sessionId: testMessage.sessionId
      });
    
    expect(savedMessage).not.toBeNull();
    expect(savedMessage.sender).toBe('user');
  });
  
  test('Backend can retrieve message history', async () => {
    // Create a session first
    const sessionResponse = await axios.post(`${API_BASE_URL}/api/chat/session`, {
      userId: 'test-user-' + Date.now(),
      subject: 'Test'
    });
    
    const sessionId = sessionResponse.data.sessionId;
    
    // Add a test message
    await axios.post(`${API_BASE_URL}/api/chat/message`, {
      text: 'History test message ' + Date.now(),
      sender: 'user',
      sessionId: sessionId,
      metadata: {}
    });
    
    // Retrieve history
    const historyResponse = await axios.get(`${API_BASE_URL}/api/chat/history/${sessionId}`);
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.data.messages).toBeDefined();
    expect(Array.isArray(historyResponse.data.messages)).toBe(true);
  });
});
