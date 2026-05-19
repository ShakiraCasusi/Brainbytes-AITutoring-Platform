const axios = require('axios');

// Legacy local backend port:
// const API_URL = 'http://localhost:3000/api';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const TEST_SESSION_ID = 'test-session-' + Date.now();

async function runTests() {
  console.log('Running API tests...');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health check response:', healthResponse.data);
    console.assert(healthResponse.data.status === 'ok', 'Health check failed');
    console.log('✓ Test 1: PASSED\n');
    
    // Test 2: Send message
    console.log('Test 2: Send message');
    const sendMessageResponse = await axios.post(`${API_URL}/chat/send`, {
      message: 'Hello, can you help me with math?',
      sessionId: TEST_SESSION_ID
    });
    console.log('Send message response:', sendMessageResponse.data);
    console.assert(sendMessageResponse.data.userMessage, 'User message not received');
    console.assert(sendMessageResponse.data.aiMessage, 'AI message not received');
    console.log('✓ Test 2: PASSED\n');
    
    // Test 3: Get chat history
    console.log('Test 3: Get chat history');
    const historyResponse = await axios.get(`${API_URL}/chat/history/${TEST_SESSION_ID}`);
    console.log('History response:', historyResponse.data);
    console.assert(Array.isArray(historyResponse.data.messages), 'Messages not returned as array');
    console.assert(historyResponse.data.messages.length >= 2, 'Expected at least 2 messages');
    console.log('✓ Test 3: PASSED\n');
    
    console.log('✓ All tests passed successfully!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

runTests();
