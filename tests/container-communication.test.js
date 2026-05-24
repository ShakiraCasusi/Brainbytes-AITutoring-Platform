const axios = require('axios');

describe('Container Communication Tests', () => {
  test('Frontend can communicate with Backend', async () => {
    // This test assumes you have an endpoint in your frontend that calls the backend
    const response = await axios.get('http://localhost:3000/api/test-backend-connection');
    expect(response.status).toBe(200);
    expect(response.data.backendConnected).toBe(true);
  });

  test('Backend can communicate with MongoDB', async () => {
    const response = await axios.get('http://localhost:4000/api/health');
    expect(response.status).toBe(200);
    expect(response.data.databaseConnected).toBe(true);
  });
});