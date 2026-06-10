const axios = require('axios');
const mongoose = require('mongoose');
const Message = require('../backend/Message');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/brainbytes_test';

// Configure Axios base URL to support exact relative endpoint paths from the institution spec
axios.defaults.baseURL = API_BASE_URL;

describe('Chat API Integration', () => {
  beforeAll(async () => {
    // Connect to database to verify persistence
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    // Close the connection
    await mongoose.disconnect();
  });

  it('should save message to database and return AI response', async () => {
    const testMessage = 'Can you help with algebra?';
    const sessionId = 'test-session';

    // Clean up past messages from this session to ensure a clean slate
    await Message.deleteMany({ sessionId: 'test-session', text: testMessage });

    const response = await axios.post('/api/chat', {
      message: testMessage,
      sessionId: sessionId,
    });

    expect(response.status).toEqual(200);
    expect(response.data.aiMessage).toBeDefined();

    // Verify message was saved to database
    const savedMessages = await Message.find({
      sessionId: 'test-session',
      text: testMessage,
    });

    expect(savedMessages).toHaveLength(1);
  });
});
