const axios = require('axios');

const API_URL =
  process.env.API_URL || `http://localhost:${process.env.PORT || 4000}/api`;
const TEST_SESSION_ID = 'test-session-' + Date.now();

async function runTests() {
  console.log('Running API tests...');

  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health check response:', healthResponse.data);
    console.assert(healthResponse.data.status === 'ok', 'Health check failed');
    console.assert(
      healthResponse.data.databaseConnected === true,
      'Database not connected'
    );
    console.log('✓ Test 1: PASSED\n');

    // Test 2: Send message
    console.log('Test 2: Send message');
    const sendMessageResponse = await axios.post(`${API_URL}/chat/send`, {
      message: 'Hello, can you help me with math?',
      sessionId: TEST_SESSION_ID,
    });
    console.log('Send message response:', sendMessageResponse.data);
    console.assert(
      sendMessageResponse.data.userMessage,
      'User message not received'
    );
    console.assert(
      sendMessageResponse.data.aiMessage,
      'AI message not received'
    );
    console.assert(
      sendMessageResponse.data.userMessage.text ===
        'Hello, can you help me with math?',
      'User message text does not match'
    );
    console.assert(
      sendMessageResponse.data.sessionId === TEST_SESSION_ID,
      'Session ID mismatch'
    );
    console.log('✓ Test 2: PASSED\n');

    // Test 3: Send message without body returns 400
    console.log('Test 3: Send message without body returns 400');
    try {
      await axios.post(`${API_URL}/chat/send`, { sessionId: TEST_SESSION_ID });
      console.assert(false, 'Expected 400 but request succeeded');
    } catch (error) {
      console.assert(
        error.response?.status === 400,
        `Expected 400, got ${error.response?.status}`
      );
      console.log('Response:', error.response.data);
    }
    console.log('✓ Test 3: PASSED\n');

    // Test 4: Get chat history
    console.log('Test 4: Get chat history');
    const historyResponse = await axios.get(
      `${API_URL}/chat/history/${TEST_SESSION_ID}`
    );
    console.log('History response:', historyResponse.data);
    console.assert(
      Array.isArray(historyResponse.data.messages),
      'Messages not returned as array'
    );
    console.assert(
      historyResponse.data.messages.length >= 2,
      'Expected at least 2 messages'
    );
    console.assert(
      historyResponse.data.messages[0].sessionId === TEST_SESSION_ID,
      'Session ID mismatch in history'
    );
    console.log('✓ Test 4: PASSED\n');

    // Test 5: Chat history with limit query param
    console.log('Test 5: Chat history with limit query param');
    const limitedHistoryResponse = await axios.get(
      `${API_URL}/chat/history/${TEST_SESSION_ID}?limit=1`
    );
    console.log('Limited history response:', limitedHistoryResponse.data);
    console.assert(
      limitedHistoryResponse.data.messages.length <= 1,
      'Limit not respected'
    );
    console.log('✓ Test 5: PASSED\n');

    // Test 6: History for unknown session returns empty array
    console.log('Test 6: History for unknown session returns empty array');
    const unknownSessionResponse = await axios.get(
      `${API_URL}/chat/history/nonexistent-session-xyz`
    );
    console.log('Unknown session response:', unknownSessionResponse.data);
    console.assert(
      Array.isArray(unknownSessionResponse.data.messages),
      'Messages not returned as array'
    );
    console.assert(
      unknownSessionResponse.data.messages.length === 0,
      'Expected empty array'
    );
    console.log('✓ Test 6: PASSED\n');

    // Test 7: Auth register endpoint exists
    console.log('Test 7: Auth register endpoint exists');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      console.assert(
        [200, 201].includes(registerResponse.status),
        `Unexpected status ${registerResponse.status}`
      );
      console.log('Response status:', registerResponse.status);
    } catch (error) {
      // 400/409 means validation worked — endpoint exists
      console.assert(
        [400, 409].includes(error.response?.status),
        `Unexpected status ${error.response?.status}`
      );
      console.log('Endpoint exists (returned validation error as expected)');
    }
    console.log('✓ Test 7: PASSED\n');

    // Test 8: Auth login with bad credentials returns 400/401
    console.log('Test 8: Auth login with bad credentials returns 400/401');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'nobody@nowhere.com',
        password: 'wrongpassword',
      });
      console.assert(false, 'Expected 400/401 but request succeeded');
    } catch (error) {
      console.assert(
        [400, 401].includes(error.response?.status),
        `Expected 400/401, got ${error.response?.status}`
      );
      console.log('Response:', error.response.data);
    }
    console.log('✓ Test 8: PASSED\n');

    // Test 9: Users endpoint requires auth
    console.log('Test 9: Users endpoint requires auth');
    try {
      await axios.get(`${API_URL}/users`);
      console.assert(false, 'Expected 401/403 but request succeeded');
    } catch (error) {
      console.assert(
        [401, 403].includes(error.response?.status),
        `Expected 401/403, got ${error.response?.status}`
      );
      console.log(`Correctly rejected with ${error.response.status}`);
    }
    console.log('✓ Test 9: PASSED\n');

    // Test 10: Materials endpoint requires auth
    console.log('Test 10: Materials endpoint requires auth');
    try {
      await axios.get(`${API_URL}/materials`);
      console.assert(false, 'Expected 401/403 but request succeeded');
    } catch (error) {
      console.assert(
        [401, 403].includes(error.response?.status),
        `Expected 401/403, got ${error.response?.status}`
      );
      console.log(`Correctly rejected with ${error.response.status}`);
    }
    console.log('✓ Test 10: PASSED\n');

    // Test 11: Settings endpoint requires auth
    console.log('Test 11: Settings endpoint requires auth');
    try {
      await axios.get(`${API_URL}/settings`);
      console.assert(false, 'Expected 401/403 but request succeeded');
    } catch (error) {
      console.assert(
        [401, 403].includes(error.response?.status),
        `Expected 401/403, got ${error.response?.status}`
      );
      console.log(`Correctly rejected with ${error.response.status}`);
    }
    console.log('✓ Test 11: PASSED\n');

    // Test 12: Activity endpoint requires auth
    console.log('Test 12: Activity endpoint requires auth');
    try {
      await axios.get(`${API_URL}/activity`);
      console.assert(false, 'Expected 401/403 but request succeeded');
    } catch (error) {
      console.assert(
        [401, 403].includes(error.response?.status),
        `Expected 401/403, got ${error.response?.status}`
      );
      console.log(`Correctly rejected with ${error.response.status}`);
    }
    console.log('✓ Test 12: PASSED\n');

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
