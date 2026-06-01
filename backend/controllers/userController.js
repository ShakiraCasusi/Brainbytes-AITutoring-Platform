const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Activity = require('../models/Activity');
const { sanitizeUser } = require('./authController');
const realtime = require('../services/realtime');

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = req.query.subject ? { preferredSubjects: req.query.subject.toLowerCase() } : {};
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users: users.map(sanitizeUser),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'preferredSubjects'];
    const updates = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Activity.create({
      userId: user._id,
      type: 'profile',
      summary: `${user.name} updated profile details`,
    });
    realtime.broadcast('user:updated', { user: sanitizeUser(user) });

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserSettings.deleteOne({ userId: user._id });
    realtime.broadcast('user:deleted', { id: user._id });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete user' });
  }
};
