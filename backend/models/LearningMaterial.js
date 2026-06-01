const mongoose = require('mongoose');

const learningMaterialSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
  },
  {
    timestamps: true,
  }
);

learningMaterialSchema.index({ subject: 1, topic: 1 });
learningMaterialSchema.index({ subject: 'text', topic: 'text', content: 'text' });

module.exports = mongoose.model('LearningMaterial', learningMaterialSchema);
