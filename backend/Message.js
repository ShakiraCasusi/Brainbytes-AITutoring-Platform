const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for common queries
messageSchema.index({ sessionId: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;