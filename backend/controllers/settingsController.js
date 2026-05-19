const UserSettings = require('../models/UserSettings');
const Activity = require('../models/Activity');
const realtime = require('../services/realtime');

exports.getSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.params.userId },
      { $setOnInsert: { userId: req.params.userId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = {};
    ['theme', 'notifications', 'readingLevel', 'dailyGoalMinutes'].forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      { new: true, upsert: true, runValidators: true }
    );

    await Activity.create({
      userId: req.params.userId,
      type: 'settings',
      summary: 'Updated learning preferences'
    });
    realtime.broadcast('settings:updated', { userId: req.params.userId, settings });

    res.json({ settings });
  } catch (error) {
    res.status(400).json({ error: 'Unable to update settings' });
  }
};
