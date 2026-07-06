// simulate-traffic.js
const fetch = require('node-fetch');

const API_PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${API_PORT}`;

async function makeRequest() {
  const endpoints = [
    '/api/session/start',
    '/api/question/ask',
    '/api/session/end'
  ];
  
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  try {
    const response = await fetch(`${BASE_URL}${randomEndpoint}`);
    console.log(`Request to ${randomEndpoint}: ${response.status}`);
  } catch (error) {
    console.error(`Error with ${randomEndpoint}:`, error.message);
  }
}

async function simulateTraffic() {
  console.log(`Starting continuous traffic simulation targeting ${BASE_URL}...`);
  while (true) {
    await makeRequest();
    // Wait between 1-5 seconds
    await new Promise(r => setTimeout(r, Math.random() * 4000 + 1000));
  }
}

simulateTraffic().catch(console.error);
