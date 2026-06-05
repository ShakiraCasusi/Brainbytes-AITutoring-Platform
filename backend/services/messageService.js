const Message = require('../Message');

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

module.exports = {
  createMessage,
};
