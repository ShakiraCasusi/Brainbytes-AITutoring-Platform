const Message = require('../Message');
const db = require('../db');

/**
 * Creates a new message instance with the correct properties.
 *
 * @param {string} text - The message body text.
 * @param {string} sender - 'user' or 'ai'.
 * @param {string} sessionId - The identifier for the chat session.
 * @returns {object} The Message mongoose document.
 */
function createMessage(text, sender, sessionId) {
  return new Message({
    text,
    sender,
    sessionId,
    timestamp: new Date(),
  });
}

async function saveMessage(message) {
  return await db.saveMessage(message);
}

async function getMessagesBySession(sessionId) {
  return await db.getMessagesBySession(sessionId);
}

module.exports = {
  createMessage,
  saveMessage,
  getMessagesBySession,
};
