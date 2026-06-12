const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────

describe('Auth middleware error handling', () => {
  test('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/users');
    console.log('No auth header response:', res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('returns 401 when token is malformed', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer not.a.valid.token');
    console.log('Malformed token response:', res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  test('returns 401 when Bearer prefix is missing', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'sometoken123');
    console.log('Missing Bearer prefix response:', res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('returns 401 when token is expired', async () => {

    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { id: 'user123', email: 'test@example.com' },
      process.env.JWT_SECRET || 'brainbytes-local-secret',
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`);
    console.log('Expired token response:', res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });
});

// ── CHAT ERROR HANDLING ───────────────────────────────────────────────────────

describe('Chat endpoint error handling', () => {
  test('returns 400 when message is empty string', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ message: '', sessionId: 'session-001' });
    console.log('Empty string message response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 when message field is null', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ message: null, sessionId: 'session-001' });
    console.log('Null message response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('handles very long messages gracefully', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ message: 'a'.repeat(1001), sessionId: 'session-001' });
    console.log('Long message response status:', res.status);
    expect(res.status).toBe(400);
  });

  test('returns 400 when saving message without text', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ sender: 'user', sessionId: 'session-001' });
    console.log('Missing text response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message text is required');
  });

  test('returns 400 when saving message without sessionId', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ text: 'Hello', sender: 'user' });
    console.log('Missing sessionId response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Session ID is required');
  });
});

// ── AUTH ERROR HANDLING ───────────────────────────────────────────────────────

describe('Auth endpoint error handling', () => {
  test('returns 400 when register body is empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    console.log('Empty register body response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 when login body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    console.log('Empty login body response:', res.body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('does not expose password hash in register response', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    });
    console.log('Register response user fields:', Object.keys(res.body.user || {}));
    expect(res.body.user?.passwordHash).toBeUndefined();
  });

  test('does not expose password hash in login response', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });
    console.log('Login response user fields:', Object.keys(res.body.user || {}));
    expect(res.body.user?.passwordHash).toBeUndefined();
  });
});

// ── 404 HANDLING ─────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  test('returns 404 for unknown GET route', async () => {
    const res = await request(app).get('/api/nonexistent');
    console.log('Unknown route response status:', res.status);
    expect(res.status).toBe(404);
  });

  test('returns 404 for unknown POST route', async () => {
    const res = await request(app).post('/api/nonexistent').send({});
    console.log('Unknown POST route response status:', res.status);
    expect(res.status).toBe(404);
  });
});