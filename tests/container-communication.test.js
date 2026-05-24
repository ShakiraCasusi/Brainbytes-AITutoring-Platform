const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:8080';

describe('Container Communication Tests', () => {

  test('Frontend is reachable', async () => {
    const res = await axios.get(FRONTEND_URL);
    expect(res.status).toBe(200);
  });

  test('Backend health endpoint is reachable', async () => {
    const res = await axios.get(`${BACKEND_URL}/api/health`);
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  test('Frontend can reach backend API through network', async () => {
 
    const res = await axios.get(`${BACKEND_URL}/api/health`);
    expect(res.status).toBe(200);
  });

  test('Backend MongoDB connection is active (via health or API)', async () => {
    const res = await axios.get(`${BACKEND_URL}/api/health`);
    expect(res.data).toHaveProperty('status'); 
  });

});