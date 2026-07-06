// simulate-activity.js
const fetch = require('node-fetch');

const API_PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${API_PORT}`;

const subjects = ['math', 'science', 'english', 'history'];
const gradeLevels = ['elementary', 'middle', 'high'];

// Simulate a tutoring session
async function simulateSession() {
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const gradeLevel = gradeLevels[Math.floor(Math.random() * gradeLevels.length)];
  
  console.log(`Starting simulated session for Subject: ${subject}, Grade: ${gradeLevel}`);
  
  // Start session
  await fetch(`${BASE_URL}/api/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, gradeLevel })
  }).then(res => console.log(`  Session start status: ${res.status}`));
  
  // Simulate 2-5 questions in the session
  const numQuestions = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < numQuestions; i++) {
    await fetch(`${BASE_URL}/api/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        gradeLevel,
        question: `Sample question ${i+1} for ${subject}`
      })
    }).then(res => console.log(`  Question ${i+1} status: ${res.status}`));
    
    // Wait 1-3 seconds between questions
    await new Promise(r => setTimeout(r, (Math.random() * 2000) + 1000));
  }
  
  // End session
  await fetch(`${BASE_URL}/api/session/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, gradeLevel })
  }).then(res => console.log(`  Session end status: ${res.status}`));
}

// Run sessions continuously
async function runSimulation() {
  console.log(`Starting continuous activity simulation targeting ${BASE_URL}...`);
  while (true) {
    await simulateSession();
    
    // Wait 2-10 seconds between sessions
    const waitTime = (Math.random() * 8000) + 2000;
    console.log(`Completed session. Waiting ${waitTime/1000} seconds before next session...\n`);
    await new Promise(r => setTimeout(r, waitTime));
  }
}

runSimulation().catch(console.error);
