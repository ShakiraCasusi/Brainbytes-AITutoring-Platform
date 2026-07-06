// simulate-scenarios.js
const fetch = require('node-fetch');

const API_PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${API_PORT}`;

const scenarios = ['normal-load', 'high-load', 'error-spikes'];
const activeScenario = process.argv[2];

if (!activeScenario || !scenarios.includes(activeScenario)) {
  console.log('Usage: node simulate-scenarios.js <scenario>');
  console.log('Available scenarios:');
  console.log('  1. normal-load       - Low-frequency simulated student tutoring sessions.');
  console.log('  2. high-load         - Concurrently spawns multiple students asking questions to stress API limits.');
  console.log('  3. error-spikes      - Generates high rates of 500 internal errors and connection drops.');
  process.exit(1);
}

const subjects = ['math', 'science', 'english', 'history'];
const gradeLevels = ['elementary', 'middle', 'high'];
const desktopAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
];
const mobileAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
];

function getRandomUserAgent() {
  // 60% mobile traffic, typical in the Philippines due to mobile-first preference
  if (Math.random() < 0.6) {
    return mobileAgents[Math.floor(Math.random() * mobileAgents.length)];
  }
  return desktopAgents[Math.floor(Math.random() * desktopAgents.length)];
}

async function sendRequest(urlPath, method = 'GET', body = null) {
  const userAgent = getRandomUserAgent();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': userAgent
  };
  
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}${urlPath}`, options);
    const duration = Date.now() - start;
    console.log(`[${activeScenario}] ${method} ${urlPath} -> Status: ${response.status} (${duration}ms) | UA: ${userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`);
    return response;
  } catch (error) {
    console.error(`[${activeScenario}] ERROR connecting to ${urlPath}: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: NORMAL LOAD
// ─────────────────────────────────────────────────────────────────────────────
async function runNormalLoad() {
  console.log('Starting Scenario: Normal Load...');
  while (true) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const gradeLevel = gradeLevels[Math.floor(Math.random() * gradeLevels.length)];
    
    await sendRequest('/api/session/start', 'POST', { subject, gradeLevel });
    
    const questions = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < questions; i++) {
      await sendRequest('/api/question', 'POST', {
        subject,
        gradeLevel,
        question: `Simulated question ${i+1}`
      });
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    }
    
    await sendRequest('/api/session/end', 'POST');
    
    const idleWait = 5000 + Math.random() * 5000;
    console.log(`Waiting ${idleWait/1000}s for next simulated student session...`);
    await new Promise(r => setTimeout(r, idleWait));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: HIGH LOAD
// ─────────────────────────────────────────────────────────────────────────────
async function runHighLoad() {
  console.log('Starting Scenario: High Load Concurrency Stress Test...');
  const numWorkers = 8;
  
  const worker = async (id) => {
    while (true) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      
      // Concurrently query sessions and trigger AI response metrics
      await sendRequest('/api/session/start', 'POST', { subject, gradeLevel: 'high' });
      
      for (let i = 0; i < 5; i++) {
        // Send requests rapidly
        await sendRequest('/api/question', 'POST', {
          subject,
          gradeLevel: 'high',
          question: `Stress question ${i+1} from worker ${id}`
        });
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      }
      
      await sendRequest('/api/session/end', 'POST');
      await new Promise(r => setTimeout(r, 500));
    }
  };

  // Launch parallel worker loops
  for (let i = 0; i < numWorkers; i++) {
    worker(i).catch(err => console.error(`Worker ${i} failed:`, err));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: ERROR SPIKES
// ─────────────────────────────────────────────────────────────────────────────
async function runErrorSpikes() {
  console.log('Starting Scenario: 500 Error and Connection Drop Spikes...');
  while (true) {
    const dice = Math.random();
    if (dice < 0.4) {
      // 40% chance of throwing a connection drop
      await sendRequest('/api/simulate-drop', 'GET');
    } else if (dice < 0.8) {
      // 40% chance of throwing a 500 server error
      await sendRequest('/api/simulate-error', 'GET');
    } else {
      // 20% normal traffic to see the ratio skew
      await sendRequest('/api/session/start', 'GET');
    }
    
    // Fast frequency (100ms - 500ms delay) to force metrics to react quickly
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
  }
}

// Boot the active scenario
switch (activeScenario) {
  case 'normal-load':
    runNormalLoad().catch(console.error);
    break;
  case 'high-load':
    runHighLoad().catch(console.error);
    break;
  case 'error-spikes':
    runErrorSpikes().catch(console.error);
    break;
}
