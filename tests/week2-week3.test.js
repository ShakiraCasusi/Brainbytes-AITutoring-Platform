const axios = require('axios');
const WebSocket = require('ws');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000/ws';

describe('Week 2 and Week 3 feature coverage', () => {
  let userId;
  let token;

  test('auth, profile CRUD, settings, and materials work', async () => {
    const email = `student-${Date.now()}@example.com`;
    const registration = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name: 'Test Student',
      email,
      password: 'Passw0rd!',
      preferredSubjects: ['math', 'science'],
    });

    expect(registration.status).toBe(201);
    expect(registration.data.token).toBeDefined();
    userId = registration.data.user.id;
    token = registration.data.token;

    const me = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.data.user.email).toBe(email);

    const update = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
      name: 'Updated Student',
      preferredSubjects: ['history'],
    });
    expect(update.data.user.name).toBe('Updated Student');

    const settings = await axios.put(`${API_BASE_URL}/api/settings/${userId}`, {
      theme: 'light',
      readingLevel: 'advanced',
      dailyGoalMinutes: 45,
      notifications: false,
    });
    expect(settings.data.settings.readingLevel).toBe('advanced');

    const material = await axios.post(`${API_BASE_URL}/api/materials`, {
      subject: 'science',
      topic: `Water cycle ${Date.now()}`,
      content:
        'Evaporation, condensation, and precipitation form the water cycle.',
    });
    expect(material.status).toBe(201);

    const materials = await axios.get(
      `${API_BASE_URL}/api/materials?subject=science`
    );
    expect(materials.data.materials.length).toBeGreaterThan(0);
  });

  test('chat response includes AI metadata and suggestions', async () => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/send`, {
      sessionId: `week-test-${Date.now()}`,
      subject: 'science',
      message: 'I am confused. What is evaporation?',
    });

    expect(response.data.category).toBe('science');
    expect(response.data.questionType).toBe('definition');
    expect(response.data.sentiment.label).toBe('confused');
    expect(response.data.suggestions.length).toBeGreaterThan(0);
  });

  test('WebSocket sends connection event', (done) => {
    const socket = new WebSocket(WS_URL);

    socket.on('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message.type).toBe('connected');
      socket.close();
      done();
    });

    socket.on('error', done);
  });
});
