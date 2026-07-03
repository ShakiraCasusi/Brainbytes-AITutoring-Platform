/**
 * Seeds realistic demo data into MongoDB and triggers Prometheus metrics.
 * Simulates a real tutoring session with multiple users, subjects, and AI responses.
 *
 * HOW TO RUN (with Docker running):
 *   node scripts/generate-demo-data.js
 *
 * OPTIONS:
 *   --sessions <n>    Number of sessions to generate (default: 5)
 *   --messages <n>    Messages per session (default: 6)
 *   --api-url <url>   API base URL (default: http://localhost:4000/api)
 */

const http = require('http');

// ── CONFIG ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const API_URL = getArg('--api-url', 'http://localhost:4000/api');
const NUM_SESSIONS = parseInt(getArg('--sessions', '5'), 10);
const MESSAGES_PER_SESSION = parseInt(getArg('--messages', '6'), 10);

// ── DEMO DATA ─────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { name: 'Maria Santos', email: `maria_${Date.now()}@brainbytes.ph`, password: 'Password123!' },
  { name: 'Juan dela Cruz', email: `juan_${Date.now()}@brainbytes.ph`, password: 'Password123!' },
  { name: 'Ana Reyes', email: `ana_${Date.now()}@brainbytes.ph`, password: 'Password123!' },
];

const DEMO_MESSAGES = {
  math: [
    'Can you help me with fractions?',
    'How do I solve quadratic equations?',
    'What is the Pythagorean theorem?',
    'Help me understand algebra',
    'What is the formula for area of a circle?',
    'How do I calculate percentages?',
  ],
  science: [
    'What is photosynthesis?',
    'Explain the water cycle',
    'What are atoms made of?',
    'How does gravity work?',
    'What is the difference between speed and velocity?',
    'Explain Newton\'s laws of motion',
  ],
  general: [
    'Hello, can you help me study?',
    'What subjects can you help with?',
    'I need help with my homework',
    'Can you explain this concept?',
    'How do I improve my grades?',
    'What is the best way to study?',
  ],
  history: [
    'What caused World War II?',
    'Who was Jose Rizal?',
    'What is the significance of the Philippine revolution?',
    'Tell me about ancient civilizations',
    'What happened during the Cold War?',
  ],
};

const SUBJECTS = ['math', 'science', 'general', 'history'];

// ── HTTP HELPERS ──────────────────────────────────────────────────────────────

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── GENERATORS ────────────────────────────────────────────────────────────────

async function checkHealth() {
  console.log('Checking backend health...');
  const res = await apiRequest('GET', '/health');
  if (res.status !== 200 || !res.body.databaseConnected) {
    console.error('Backend is not healthy:', res.body);
    console.error('Make sure Docker containers are running: docker-compose up -d');
    process.exit(1);
  }
  console.log('✓ Backend healthy\n');
}

async function registerUser(user) {
  const res = await apiRequest('POST', '/auth/register', user);
  if (res.status === 201) {
    console.log(`  ✓ Registered user: ${user.name}`);
    return res.body.token;
  } else if (res.status === 409) {
    console.log(`  ⚠ User already exists: ${user.email}`);
    const loginRes = await apiRequest('POST', '/auth/login', {
      email: user.email,
      password: user.password,
    });
    return loginRes.body.token;
  }
  return null;
}

async function simulateAuthFailures(count = 3) {
  console.log(`\nSimulating ${count} failed login attempts (auth metrics)...`);
  for (let i = 0; i < count; i++) {
    await apiRequest('POST', '/auth/login', {
      email: 'nonexistent@brainbytes.ph',
      password: 'wrongpassword',
    });
    await sleep(200);
  }
  console.log('  ✓ Auth failure metrics generated');
}

async function simulateSession(sessionIndex) {
  const subject = randomItem(SUBJECTS);
  const sessionId = `demo-session-${Date.now()}-${sessionIndex}`;
  const messages = DEMO_MESSAGES[subject] || DEMO_MESSAGES.general;
  const messageCount = Math.min(MESSAGES_PER_SESSION, messages.length);

  console.log(`\n  Session ${sessionIndex + 1}: subject=${subject}, messages=${messageCount}`);

  // Start session
  await apiRequest('GET', '/session/start');

  for (let i = 0; i < messageCount; i++) {
    const message = messages[i];
    const res = await apiRequest('POST', '/messages', {
      text: message,
      sessionId,
      subject,
    });

    if (res.status === 201 || res.status === 200) {
      const category = res.body.category || subject;
      console.log(`    ✓ Message ${i + 1}/${messageCount}: "${message.substring(0, 40)}..." → [${category}]`);
    } else {
      console.log(`    ✗ Message failed: status ${res.status}`);
    }

    // Realistic delay between messages (0.5–2s)
    await sleep(randomInt(500, 2000));
  }

  // End session
  await apiRequest('GET', '/session/end');
  return sessionId;
}

async function simulateErrors() {
  console.log('\nSimulating error scenarios (error distribution metrics)...');

  // Simulate server errors
  for (let i = 0; i < 3; i++) {
    await apiRequest('GET', '/simulate-error');
    await sleep(300);
  }
  console.log('  ✓ Server error metrics generated');

  // Simulate connection drops
  for (let i = 0; i < 2; i++) {
    await apiRequest('GET', '/simulate-drop');
    await sleep(300);
  }
  console.log('  ✓ Connection drop metrics generated');

  // Simulate validation errors (missing message body)
  for (let i = 0; i < 3; i++) {
    await apiRequest('POST', '/messages', { sessionId: 'error-test' });
    await sleep(200);
  }
  console.log('  ✓ Validation error metrics generated');

  // Simulate 404s
  await apiRequest('GET', '/nonexistent-route');
  await apiRequest('GET', '/api/v99/fake');
  console.log('  ✓ 404 error metrics generated');
}

async function printMetricsSummary() {
  console.log('\n── Metrics Summary ─────────────────────────────────────────');
  const res = await apiRequest('GET', '/..'); // won't work via API, just inform user
  console.log('View live metrics at: http://localhost:4000/metrics');
  console.log('View Prometheus UI at: http://localhost:9090');
  console.log('\nUseful PromQL queries to verify demo data:');
  console.log('  brainbytes_ai_queries_total');
  console.log('  brainbytes_messages_stored_total');
  console.log('  brainbytes_active_sessions');
  console.log('  brainbytes_errors_total');
  console.log('  histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))');
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BrainBytes Demo Data Generator');
  console.log(`  API: ${API_URL}`);
  console.log(`  Sessions: ${NUM_SESSIONS}, Messages per session: ${MESSAGES_PER_SESSION}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Health check
  await checkHealth();

  // Step 2: Register demo users
  console.log('Registering demo users...');
  const tokens = [];
  for (const user of DEMO_USERS) {
    const token = await registerUser(user);
    if (token) tokens.push(token);
    await sleep(300);
  }
  console.log(`✓ ${tokens.length} users ready\n`);

  // Step 3: Simulate auth failures
  await simulateAuthFailures(3);

  // Step 4: Simulate tutoring sessions
  console.log(`\nSimulating ${NUM_SESSIONS} tutoring sessions...`);
  const sessionIds = [];
  for (let i = 0; i < NUM_SESSIONS; i++) {
    const sessionId = await simulateSession(i);
    sessionIds.push(sessionId);
    await sleep(500);
  }
  console.log(`\n✓ ${sessionIds.length} sessions completed`);

  // Step 5: Simulate errors for error distribution metrics
  await simulateErrors();

  // Step 6: Print summary
  await printMetricsSummary();

  console.log('\n✓ Demo data generation complete!');
  console.log(`  ${NUM_SESSIONS * MESSAGES_PER_SESSION * 2} messages stored (user + AI)`);
  console.log(`  ${DEMO_USERS.length} users created`);
  console.log(`  Multiple error types triggered for distribution metrics`);
}

main().catch((err) => {
  console.error('Demo data generation failed:', err.message);
  process.exit(1);
});