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
          text: 'Hello',
          sender: 'user',
          sessionId: 'test-123',
          timestamp: new Date(),
          _id: 'mock-id-0',
        },
      ]),
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            text: 'Hello',
            sender: 'user',
            sessionId: 'test-123',
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
  test('POST /api/chat returns a response', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello', sessionId: 'test-123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/chat/history returns message history', async () => {
    const response = await request(app).get('/api/chat/history/test-123');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messages');
    expect(Array.isArray(response.body.messages)).toBe(true);
  });
});
