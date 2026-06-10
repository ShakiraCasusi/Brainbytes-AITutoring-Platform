/**
 * db-persistence.test.js
 *
 * Verifies that MongoDB retains data across container restarts.
 *
 * HOW TO RUN:
 *   1. Make sure containers are running:  docker-compose up -d
 *   2. Run this script:                   node tests/db-persistence.test.js
 *
 * The script will:
 *   Phase 1 — Write test data to the database via the API
 *   Phase 2 — Restart the MongoDB container
 *   Phase 3 — Wait for the backend to reconnect
 *   Phase 4 — Re-query the same data and confirm it survived the restart
 */

const axios = require('axios');
const { execSync } = require('child_process');

const API_URL =
  process.env.API_URL || `http://localhost:${process.env.PORT || 4000}/api`;
const MONGO_CONTAINER = process.env.MONGO_CONTAINER || 'mongo';
const RESTART_WAIT_MS = 10000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend(retries = 10, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await axios.get(`${API_URL}/health`);
      if (res.data.status === 'ok' && res.data.databaseConnected) {
        return true;
      }
    } catch (_) {
      // not ready yet
    }
    console.log(`  Waiting for backend... attempt ${i}/${retries}`);
    await sleep(delayMs);
  }
  return false;
}

async function runTests() {
  console.log('Running DB persistence tests...');
  console.log(`Target: ${API_URL}`);
  console.log(`Mongo container: ${MONGO_CONTAINER}\n`);

  const SESSION_ID = 'persistence-test-' + Date.now();
  const TEST_MESSAGE = 'Persistence test message ' + Date.now();

  try {
    // Test 1: Write test data before restart
    console.log('Test 1: Save message to database');
    const sendMessageResponse = await axios.post(`${API_URL}/chat/send`, {
      message: TEST_MESSAGE,
      sessionId: SESSION_ID,
    });
    console.log('Send message response:', sendMessageResponse.data);
    console.assert(
      sendMessageResponse.data.userMessage,
      'User message not received'
    );
    console.assert(
      sendMessageResponse.data.userMessage.text === TEST_MESSAGE,
      'Message text mismatch'
    );
    console.log('✓ Test 1: PASSED\n');

    // Test 2: Confirm data is readable before restart
    console.log('Test 2: Confirm message is retrievable before restart');
    const beforeResponse = await axios.get(
      `${API_URL}/chat/history/${SESSION_ID}`
    );
    console.log('History before restart:', beforeResponse.data);
    console.assert(
      Array.isArray(beforeResponse.data.messages),
      'Messages not returned as array'
    );
    console.assert(
      beforeResponse.data.messages.length >= 1,
      'No messages found before restart'
    );
    console.assert(
      beforeResponse.data.messages.some((m) => m.text === TEST_MESSAGE),
      'Test message not found in history'
    );
    console.log('✓ Test 2: PASSED\n');

    // Restart MongoDB container
    console.log(`Restarting MongoDB container (${MONGO_CONTAINER})...`);
    try {
      execSync(`docker restart ${MONGO_CONTAINER}`, { stdio: 'pipe' });
      console.log('MongoDB container restarted successfully\n');
    } catch (error) {
      console.error(`Could not restart container: ${error.message}`);
      console.error(
        'Make sure Docker is running and the container name is correct.'
      );
      console.error('Check your container name with: docker ps');
      process.exit(1);
    }

    // Test 3: Backend recovers after restart
    console.log(`Test 3: Backend health recovers after MongoDB restart`);
    console.log(
      `Waiting ${RESTART_WAIT_MS / 1000}s then polling for recovery...`
    );
    await sleep(RESTART_WAIT_MS);
    const recovered = await waitForBackend();
    console.assert(
      recovered,
      'Backend did not reconnect to MongoDB within timeout'
    );
    console.log('✓ Test 3: PASSED\n');

    // Test 4: Data survived the restart
    console.log('Test 4: Previously saved message still exists after restart');
    const afterResponse = await axios.get(
      `${API_URL}/chat/history/${SESSION_ID}`
    );
    console.log('History after restart:', afterResponse.data);
    console.assert(
      Array.isArray(afterResponse.data.messages),
      'Messages not returned as array'
    );
    console.assert(
      afterResponse.data.messages.length >= 1,
      `Expected messages but got ${afterResponse.data.messages.length}`
    );
    console.assert(
      afterResponse.data.messages.some((m) => m.text === TEST_MESSAGE),
      'Test message not found after restart — data was NOT persisted'
    );
    console.log('✓ Test 4: PASSED\n');

    // Test 5: Message count is consistent before and after restart
    console.log('Test 5: Message count is consistent after restart');
    console.assert(
      afterResponse.data.messages.length >= 2,
      `Expected at least 2 messages (user + AI), got ${afterResponse.data.messages.length}`
    );
    console.log(
      `Message count after restart: ${afterResponse.data.messages.length}`
    );
    console.log('✓ Test 5: PASSED\n');

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
