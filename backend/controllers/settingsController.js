const UserSettings = require('../models/UserSettings');
const Activity = require('../models/Activity');
const realtime = require('../services/realtime');
const mongoose = require('mongoose');

exports.getSettings = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        settings: {
          theme: 'light',
          readingLevel: 'intermediate',
          dailyGoalMinutes: 30,
          notifications: true,
        }
      });
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.json({ settings: req.body });
    }

    const updates = {};
    ['theme', 'notifications', 'readingLevel', 'dailyGoalMinutes'].forEach(
      (key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
    );

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    await Activity.create({
      userId: req.params.userId,
      type: 'settings',
      summary: 'Updated learning preferences',
    });
    realtime.broadcast('settings:updated', {
      userId: req.params.userId,
      settings,
    });

    res.json({ settings });
  } catch (error) {
    res.status(400).json({ error: 'Unable to update settings' });
  }
};
