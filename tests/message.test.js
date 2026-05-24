const { createMessage } = require('../backend/services/messageService');

describe('Message Service', () => {
  it('should create a new message with correct properties', () => {
    const messageText = 'Hello, how can I help with math?';
    const sender = 'ai';
    const sessionId = 'test-session';

    const message = createMessage(messageText, sender, sessionId);

    expect(message.text).toEqual(messageText);
    expect(message.sender).toEqual(sender);
    expect(message.sessionId).toEqual(sessionId);
    expect(message.timestamp).toBeDefined();
  });
});
