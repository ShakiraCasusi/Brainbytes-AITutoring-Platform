const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Activity = require('../models/Activity');
const { createToken } = require('../middleware/auth');
const realtime = require('../services/realtime');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    preferredSubjects: user.preferredSubjects || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, preferredSubjects = [] } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      preferredSubjects,
    });
    await UserSettings.create({ userId: user._id });
    await Activity.create({
      userId: user._id,
      type: 'profile',
      summary: `${user.name} created a profile`,
    });
    realtime.broadcast('user:created', { user: sanitizeUser(user) });

    res
      .status(201)
      .json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to register user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastActiveAt = new Date();
    await user.save();

    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to log in' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load current user' });
  }
};

exports.sanitizeUser = sanitizeUser;
