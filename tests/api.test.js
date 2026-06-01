const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

describe('Backend API Tests', () => {
  test('Health endpoint returns OK', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('Chat endpoint processes messages', async () => {
    const testMessage = {
      message: 'Hello, can you help with math?',
      sessionId: 'test-session',
    };

    const response = await axios.post(`${API_URL}/chat/send`, testMessage);
    expect(response.status).toBe(200);
    expect(response.data.userMessage).toBeDefined();
    expect(response.data.userMessage.text).toBe(testMessage.message);
    expect(response.data.aiMessage).toBeDefined();
  });

  test('History endpoint returns messages', async () => {
    const sessionId = 'test-session';
    const response = await axios.get(`${API_URL}/chat/history/${sessionId}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.messages)).toBe(true);
  });
});
