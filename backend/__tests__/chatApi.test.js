jest.mock('express-rate-limit', () => {
  return jest.fn().mockReturnValue((req, res, next) => next());
});
const request = require('supertest');
const app = require('../app');

// Mock mongoose to prevent DB connection attempts/errors and schema errors
jest.mock('mongoose', () => {
  const Schema = function () {
    this.index = jest.fn();
    this.pre = jest.fn();
    this.post = jest.fn();
  };
  Schema.Types = {
    ObjectId: String,
  };
  return {
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
    },
    Schema: Schema,
    model: jest.fn().mockImplementation((_name, _schema) => {
      function MockModel(data) {
        Object.assign(this, data);
      }
      MockModel.find = jest.fn().mockResolvedValue([]);
      MockModel.findOne = jest.fn().mockResolvedValue(null);
      MockModel.create = jest.fn().mockResolvedValue({});
      MockModel.prototype.save = jest.fn().mockResolvedValue(true);
      return MockModel;
    }),
  };
});

// Mock Message model
jest.mock('../Message', () => {
  function MockMessage(data) {
    this.text = data.text;
    this.sender = data.sender;
    this.sessionId = data.sessionId;
    this.subject = data.subject;
    this.timestamp = data.timestamp || new Date();
    this._id = 'mock-msg-id-123';
  }
  MockMessage.prototype.save = jest.fn().mockResolvedValue(true);
  MockMessage.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([
        {
          text: 'Hello AI',
          sender: 'user',
          sessionId: 'test-session',
          timestamp: new Date(),
          _id: 'mock-id-0',
        },
      ]),
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            text: 'Hello AI',
            sender: 'user',
            sessionId: 'test-session',
            timestamp: new Date(),
            _id: 'mock-id-0',
          },
        ]),
      }),
    }),
  });
  MockMessage.countDocuments = jest.fn().mockResolvedValue(1);
  MockMessage.updateMany = jest.fn().mockResolvedValue({ nModified: 1 });
  MockMessage.db = {
    collection: jest.fn().mockReturnValue({
      insertOne: jest
        .fn()
        .mockResolvedValue({ insertedId: 'mock-session-id-123' }),
    }),
  };
  return MockMessage;
});

// Mock Activity model
jest.mock('../models/Activity', () => {
  return {
    create: jest.fn().mockResolvedValue(true),
  };
});

describe('Chat API', () => {
  test('POST /api/chat/send returns correct response', async () => {
    const response = await request(app).post('/api/chat/send').send({
      message: 'Hello AI',
      sessionId: 'test-session',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('userMessage');
    expect(response.body).toHaveProperty('aiMessage');
    expect(response.body.userMessage.text).toBe('Hello AI');
    expect(response.body.aiMessage).toBeDefined();
  });

  test('GET /api/chat/history/:sessionId returns messages', async () => {
    const response = await request(app).get('/api/chat/history/test-session');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messages');
    expect(Array.isArray(response.body.messages)).toBe(true);
  });

  test('POST /api/chat/send with invalid data returns 400', async () => {
    const response = await request(app).post('/api/chat/send').send({
      /* missing message field */
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
