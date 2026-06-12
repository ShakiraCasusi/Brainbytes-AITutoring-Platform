const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Message = require('../Message');
const User = require('../models/User');
const Activity = require('../models/Activity');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
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

// ── MESSAGE MODEL ─────────────────────────────────────────────────────────────

describe('Message model', () => {
  test('saves a valid user message', async () => {
    const message = new Message({
      text: 'Hello, help me with math',
      sender: 'user',
      sessionId: 'session-001',
    });
    const saved = await message.save();
    console.log('Saved message:', saved.toObject());

    expect(saved._id).toBeDefined();
    expect(saved.text).toBe('Hello, help me with math');
    expect(saved.sender).toBe('user');
    expect(saved.sessionId).toBe('session-001');
    expect(saved.timestamp).toBeDefined();
  });

  test('saves a valid AI message', async () => {
    const message = new Message({
      text: 'I can help with math!',
      sender: 'ai',
      sessionId: 'session-001',
    });
    const saved = await message.save();
    console.log('Saved AI message:', saved.toObject());
    expect(saved.sender).toBe('ai');
  });

  test('fails validation when text is missing', async () => {
    const message = new Message({
      sender: 'user',
      sessionId: 'session-001',
    });
    console.log('Testing missing text validation...');
    await expect(message.save()).rejects.toThrow();
  });

  test('fails validation when sender is invalid', async () => {
    const message = new Message({
      text: 'Hello',
      sender: 'admin',
      sessionId: 'session-001',
    });
    console.log('Testing invalid sender validation...');
    await expect(message.save()).rejects.toThrow();
  });

  test('fails validation when sessionId is missing', async () => {
    const message = new Message({
      text: 'Hello',
      sender: 'user',
    });
    console.log('Testing missing sessionId validation...');
    await expect(message.save()).rejects.toThrow();
  });

  test('fails validation when text exceeds 1000 characters', async () => {
    const message = new Message({
      text: 'a'.repeat(1001),
      sender: 'user',
      sessionId: 'session-001',
    });
    console.log('Testing maxlength validation...');
    await expect(message.save()).rejects.toThrow();
  });

  test('retrieves messages by sessionId in chronological order', async () => {
    await Message.create({ text: 'First', sender: 'user', sessionId: 'session-002', timestamp: new Date('2024-01-01T10:00:00Z') });
    await Message.create({ text: 'Second', sender: 'ai', sessionId: 'session-002', timestamp: new Date('2024-01-01T10:00:01Z') });
    await Message.create({ text: 'Third', sender: 'user', sessionId: 'session-002', timestamp: new Date('2024-01-01T10:00:02Z') });

    const messages = await Message.find({ sessionId: 'session-002' }).sort({ timestamp: 1 });
    console.log('Retrieved messages:', messages.map((m) => m.text));

    expect(messages.length).toBe(3);
    expect(messages[0].text).toBe('First');
    expect(messages[1].text).toBe('Second');
    expect(messages[2].text).toBe('Third');
  });

  test('returns empty array for unknown sessionId', async () => {
    const messages = await Message.find({ sessionId: 'nonexistent' });
    console.log('Unknown session messages:', messages);
    expect(messages).toEqual([]);
  });

  test('saves optional subject field', async () => {
    const message = new Message({
      text: 'What is gravity?',
      sender: 'user',
      sessionId: 'session-003',
      subject: 'science',
    });
    const saved = await message.save();
    console.log('Message with subject:', saved.toObject());
    expect(saved.subject).toBe('science');
  });

  test('counts messages by sessionId', async () => {
    await Message.create({ text: 'Msg 1', sender: 'user', sessionId: 'session-004' });
    await Message.create({ text: 'Msg 2', sender: 'ai', sessionId: 'session-004' });
    await Message.create({ text: 'Other', sender: 'user', sessionId: 'other-session' });

    const count = await Message.countDocuments({ sessionId: 'session-004' });
    console.log('Message count for session-004:', count);
    expect(count).toBe(2);
  });
});

// ── USER MODEL ────────────────────────────────────────────────────────────────

describe('User model', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedpassword123',
  };

  test('saves a valid user', async () => {
    const user = await User.create(validUser);
    console.log('Saved user:', user.toObject());
    expect(user._id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.createdAt).toBeDefined();
  });

  test('lowercases email on save', async () => {
    const user = await User.create({ ...validUser, email: 'TEST@EXAMPLE.COM' });
    console.log('Lowercased email:', user.email);
    expect(user.email).toBe('test@example.com');
  });

  test('fails validation when name is missing', async () => {
    console.log('Testing missing name validation...');
    await expect(
      User.create({ email: 'test@example.com', passwordHash: 'hash' })
    ).rejects.toThrow();
  });

  test('fails validation when email is missing', async () => {
    console.log('Testing missing email validation...');
    await expect(
      User.create({ name: 'Test', passwordHash: 'hash' })
    ).rejects.toThrow();
  });

  test('enforces unique email constraint', async () => {
    await User.create(validUser);
    console.log('Testing duplicate email...');
    await expect(User.create(validUser)).rejects.toThrow();
  });

  test('saves preferredSubjects array', async () => {
    const user = await User.create({
      ...validUser,
      preferredSubjects: ['math', 'science'],
    });
    console.log('User with subjects:', user.preferredSubjects);
    expect(user.preferredSubjects).toContain('math');
    expect(user.preferredSubjects).toContain('science');
  });

  test('finds user by email', async () => {
    await User.create(validUser);
    const found = await User.findOne({ email: 'test@example.com' });
    console.log('Found user:', found?.email);
    expect(found).not.toBeNull();
    expect(found.email).toBe('test@example.com');
  });
});

// ── ACTIVITY MODEL ────────────────────────────────────────────────────────────

describe('Activity model', () => {
  test('saves a valid activity', async () => {
    const activity = await Activity.create({
      sessionId: 'session-001',
      type: 'message',
      summary: 'User sent a message',
    });
    console.log('Saved activity:', activity.toObject());
    expect(activity._id).toBeDefined();
    expect(activity.type).toBe('message');
    expect(activity.summary).toBe('User sent a message');
  });

  test('fails validation when type is invalid', async () => {
    console.log('Testing invalid activity type...');
    await expect(
      Activity.create({
        sessionId: 'session-001',
        type: 'invalid-type',
        summary: 'Something happened',
      })
    ).rejects.toThrow();
  });

  test('fails validation when summary is missing', async () => {
    console.log('Testing missing summary...');
    await expect(
      Activity.create({ sessionId: 'session-001', type: 'message' })
    ).rejects.toThrow();
  });

  test('retrieves activities by sessionId', async () => {
    await Activity.create({ sessionId: 'session-abc', type: 'message', summary: 'First activity' });
    await Activity.create({ sessionId: 'session-abc', type: 'material', summary: 'Second activity' });
    await Activity.create({ sessionId: 'other-session', type: 'message', summary: 'Other activity' });

    const activities = await Activity.find({ sessionId: 'session-abc' });
    console.log('Activities for session-abc:', activities.length);
    expect(activities.length).toBe(2);
  });
});