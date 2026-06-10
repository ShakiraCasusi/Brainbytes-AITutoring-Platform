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
      return MockModel;
    }),
  };
});

const messageService = require('../services/messageService');
const db = require('../db');

// Mock the database module
jest.mock('../db');

describe('Message Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('saveMessage calls database with correct data', async () => {
    // Setup the mock
    db.saveMessage.mockResolvedValueOnce({ insertedId: '123' });

    // Call the service
    const message = { text: 'Test message', sender: 'user' };
    await messageService.saveMessage(message);

    // Verify the database was called correctly
    expect(db.saveMessage).toHaveBeenCalledWith(message);
    expect(db.saveMessage).toHaveBeenCalledTimes(1);
  });

  test('getMessagesBySession returns messages from database', async () => {
    // Setup mock data
    const mockMessages = [
      { text: 'Hello', sender: 'user' },
      { text: 'Hi there', sender: 'ai' },
    ];

    // Setup the mock
    db.getMessagesBySession.mockResolvedValueOnce(mockMessages);

    // Call the service
    const result = await messageService.getMessagesBySession('test-session');

    // Verify results
    expect(result).toEqual(mockMessages);
    expect(db.getMessagesBySession).toHaveBeenCalledWith('test-session');
  });
});
