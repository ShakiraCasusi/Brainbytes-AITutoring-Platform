const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── HEALTH ───────────────────────────────────────────────────────────────────

describe('Health endpoint', () => {
  test('GET /api/health returns ok with database connected', async () => {
    const res = await request(app).get('/api/health');
    console.log('Health response:', res.body);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.databaseConnected).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });
});

// ── AUTH ─────────────────────────────────────────────────────────────────────

describe('Auth endpoints', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    test('registers a new user with valid data', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      console.log('Register response:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.name).toBe(validUser.name);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    test('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'Password123!' });
      console.log('Missing name response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', password: 'Password123!' });
      console.log('Missing email response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com' });
      console.log('Missing password response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'short' });
      console.log('Short password response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    test('returns 409 when email is already registered', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      console.log('Duplicate email response:', res.body);
      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    test('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      console.log('Login response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
    });

    test('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });
      console.log('Wrong password response:', res.body);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    test('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Password123!' });
      console.log('Non-existent email response:', res.body);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    test('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123!' });
      console.log('Missing email login response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email });
      console.log('Missing password login response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns current user with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      console.log('Me response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validUser.email);
    });

    test('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      console.log('No token response:', res.body);
      expect(res.status).toBe(401);
    });

    test('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      console.log('Invalid token response:', res.body);
      expect(res.status).toBe(401);
    });
  });
});

// ── CHAT ─────────────────────────────────────────────────────────────────────

describe('Chat endpoints', () => {
  const TEST_SESSION_ID = 'test-session-jest-' + Date.now();

  describe('POST /api/chat/send', () => {
    test('sends a message and returns user and AI response', async () => {
      const res = await request(app).post('/api/chat/send').send({
        message: 'Hello, can you help me with math?',
        sessionId: TEST_SESSION_ID,
      });
      console.log('Send message response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.userMessage).toBeDefined();
      expect(res.body.aiMessage).toBeDefined();
      expect(res.body.userMessage.text).toBe('Hello, can you help me with math?');
      expect(res.body.userMessage.sender).toBe('user');
      expect(res.body.aiMessage.sender).toBe('ai');
      expect(res.body.sessionId).toBe(TEST_SESSION_ID);
    });

    test('generates a sessionId when not provided', async () => {
      const res = await request(app).post('/api/chat/send').send({
        message: 'Hello!',
      });
      console.log('Auto sessionId response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });

    test('returns 400 when message is missing', async () => {
      const res = await request(app).post('/api/chat/send').send({
        sessionId: TEST_SESSION_ID,
      });
      console.log('Missing message response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Message is required');
    });

    test('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/chat/send').send({});
      console.log('Empty body response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('handles subject field correctly', async () => {
      const res = await request(app).post('/api/chat/send').send({
        message: 'What is photosynthesis?',
        sessionId: TEST_SESSION_ID,
        subject: 'science',
      });
      console.log('Subject response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.userMessage.subject).toBe('science');
    });
  });

  describe('GET /api/chat/history/:sessionId', () => {
    beforeEach(async () => {

      await request(app).post('/api/chat/send').send({
        message: 'First message',
        sessionId: TEST_SESSION_ID,
      });
      await request(app).post('/api/chat/send').send({
        message: 'Second message',
        sessionId: TEST_SESSION_ID,
      });
    });

    test('returns messages for a session in chronological order', async () => {
      const res = await request(app).get(`/api/chat/history/${TEST_SESSION_ID}`);
      console.log('History response:', res.body);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
      // Check chronological order
      const timestamps = res.body.messages.map((m) => new Date(m.timestamp).getTime());
      expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    });

    test('respects limit query param', async () => {
      const res = await request(app).get(
        `/api/chat/history/${TEST_SESSION_ID}?limit=1`
      );
      console.log('Limited history response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    test('respects page query param', async () => {
      const res = await request(app).get(
        `/api/chat/history/${TEST_SESSION_ID}?limit=1&page=2`
      );
      console.log('Page 2 response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
    });

    test('returns empty array for unknown session', async () => {
      const res = await request(app).get('/api/chat/history/nonexistent-session-xyz');
      console.log('Unknown session response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.messages).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    test('filters by subject query param', async () => {
      await request(app).post('/api/chat/send').send({
        message: 'Science question',
        sessionId: TEST_SESSION_ID,
        subject: 'science',
      });
      const res = await request(app).get(
        `/api/chat/history/${TEST_SESSION_ID}?subject=science`
      );
      console.log('Subject filter response:', res.body);
      expect(res.status).toBe(200);
      res.body.messages.forEach((m) => {
        expect(m.subject).toBe('science');
      });
    });
  });

  describe('POST /api/chat/session', () => {
    test('creates a new chat session', async () => {
      const res = await request(app).post('/api/chat/session').send({
        userId: 'user123',
        subject: 'Math',
      });
      console.log('Create session response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
      expect(res.body.session).toBeDefined();
    });

    test('creates session with anonymous user when userId not provided', async () => {
      const res = await request(app).post('/api/chat/session').send({});
      console.log('Anonymous session response:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });
  });
});

// ── PROTECTED ROUTES ─────────────────────────────────────────────────────────

describe('Protected routes require auth', () => {
  test('GET /api/users returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('GET /api/materials returns 401 without token', async () => {
    const res = await request(app).get('/api/materials');
    expect(res.status).toBe(401);
  });

  test('GET /api/settings returns 401 without token', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  test('GET /api/activity returns 401 without token', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.status).toBe(401);
  });
});