const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration for services
const config = {
  // Legacy container-only endpoints:
  // backend: 'http://backend:4000',
  // mongodb: 'mongodb://mongodb:27017/brainbytes_test'
  backend: process.env.API_BASE_URL || 'http://localhost:4000',
  mongodb: process.env.MONGO_URI || 'mongodb://localhost:27017/brainbytes_test',
};

jest.setTimeout(25000);

describe('Container Communication Tests', () => {
  let mongoClient;
  let db;

  beforeAll(async () => {
    // Connect to MongoDB
    mongoClient = await MongoClient.connect(config.mongodb);
    db = mongoClient.db();

    // Legacy blanket cleanup caused cross-test interference when suites ran together.
    // await db.collection('messages').deleteMany({});
    // await db.collection('sessions').deleteMany({});
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  test('Backend can connect to MongoDB', async () => {
    const response = await axios.get(`${config.backend}/api/health`);
    expect(response.status).toBe(200);
    expect(response.data.databaseConnected).toBe(true);
  });

  test('Backend health status is ok', async () => {
    const response = await axios.get(`${config.backend}/api/health`);
    expect(response.data.status).toBe('ok');
    expect(response.data.timestamp).toBeDefined();
  });

  test('Complete communication flow: Backend -> MongoDB', async () => {
    // Create a session
    const sessionResponse = await axios.post(
      `${config.backend}/api/chat/session`,
      {
        userId: 'test-user-' + Date.now(),
        subject: 'Communication Test',
      }
    );

    expect(sessionResponse.status).toBe(200);
    const sessionId = sessionResponse.data.sessionId.toString();

    // Create a unique test message
    const testMessage = `Test message ${Date.now()}`;

    // Send message through backend API
    const messageResponse = await axios.post(
      `${config.backend}/api/chat/message`,
      {
        text: testMessage,
        sender: 'user',
        sessionId: sessionId,
        metadata: {},
      }
    );

    expect(messageResponse.status).toBe(200);
    expect(messageResponse.data.messageId).toBeDefined();

    // Wait a moment for async processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify message was saved in MongoDB
    const savedMessage = await db.collection('messages').findOne({
      text: testMessage,
    });

    expect(savedMessage).not.toBeNull();
    expect(savedMessage.sender).toBe('user');
    expect(savedMessage.sessionId).toBe(sessionId);
  });

  test('Message history pagination works correctly', async () => {
    // Create a session
    const sessionResponse = await axios.post(
      `${config.backend}/api/chat/session`,
      {
        userId: 'pagination-test-' + Date.now(),
        subject: 'Pagination Test',
      }
    );

    const sessionId = sessionResponse.data.sessionId.toString();

    // Add multiple messages
    for (let i = 0; i < 5; i++) {
      await axios.post(`${config.backend}/api/chat/message`, {
        text: `Pagination test message ${i} - ${Date.now()}`,
        sender: 'user',
        sessionId: sessionId,
        metadata: {},
      });
    }

    // Retrieve with pagination
    const page1 = await axios.get(
      `${config.backend}/api/chat/history/${sessionId}?page=1&limit=2`
    );
    expect(page1.status).toBe(200);
    expect(page1.data.messages.length).toBeLessThanOrEqual(2);
    expect(page1.data.pagination.total).toBeGreaterThanOrEqual(5);
  });
});
