const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const aiService = require('./aiService');
const Message = require('./Message');

const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const activityRoutes = require('./routes/activityRoutes');

const { requireAuth } = require('./middleware/auth');

const app = express();

/* ---------------- MIDDLEWARE ---------------- */

app.use(
  cors({
    origin: 'http://localhost:8080',
    credentials: true,
  })
);

app.set('trust proxy', 1);
app.use(helmet());

app.use(express.json({ limit: '1mb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ---------------- BASIC ROUTES ---------------- */

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;

  res.status(state === 1 ? 200 : 500).json({
    status: state === 1 ? 'ok' : 'error',
    db: state === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- ROUTE MODULES ---------------- */

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/materials', requireAuth, materialRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/activity', requireAuth, activityRoutes);

/* ---------------- CHAT MESSAGE ENDPOINT ---------------- */

/**
 * Save user message + AI response
 */
app.post('/api/messages', async (req, res) => {
  try {
    const { text, sessionId = 'legacy' } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    /* 1. Save user message */
    const userMessage = await Message.create({
      text,
      sender: 'user',
      sessionId,
      timestamp: new Date(),
    });

    /* 2. Get AI response */
    const aiResult = await aiService.generateResponse(text);

    /* 3. Save AI message */
    const aiMessage = await Message.create({
      text: aiResult.response,
      sender: 'ai',
      sessionId,
      timestamp: new Date(),
    });

    /* 4. Return response */
    res.status(201).json({
      userMessage,
      aiMessage,
      category: aiResult.category,
    });
  } catch (err) {
    console.error('Error in /api/messages:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET CHAT HISTORY  ---------------- */

app.get('/api/messages/:sessionId', async (req, res) => {
  try {
    const messages = await Message.find({
      sessionId: req.params.sessionId,
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- RECENT ACTIVITY ---------------- */

app.get('/api/activity/recent', async (req, res) => {
  try {
    const recent = await Message.find({}).sort({ timestamp: -1 }).limit(20);

    res.json(recent);
  } catch (err) {
    console.error('Error fetching activity:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
