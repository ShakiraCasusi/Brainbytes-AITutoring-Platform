const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('../Message');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const LearningMaterial = require('../models/LearningMaterial');
const Activity = require('../models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brainbytes_test';
const outputDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

async function exportCollection(name, model) {
  const records = await model.find({}).lean();
  const filePath = path.join(outputDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
  return { name, count: records.length, filePath };
}

async function backup() {
  fs.mkdirSync(outputDir, { recursive: true });
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const results = await Promise.all([
    exportCollection('messages', Message),
    exportCollection('users', User),
    exportCollection('settings', UserSettings),
    exportCollection('materials', LearningMaterial),
    exportCollection('activity', Activity)
  ]);

  await mongoose.disconnect();
  console.log(JSON.stringify({ outputDir, results }, null, 2));
}

backup().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
