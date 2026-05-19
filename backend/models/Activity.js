const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['message', 'material', 'profile', 'settings']
  },
  subject: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180
  }
}, {
  timestamps: true
});

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
