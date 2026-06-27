const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const aiService = require('./aiService');
const Message = require('./Message');
const Activity = require('./models/Activity');

const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const activityRoutes = require('./routes/activityRoutes');

const { requireAuth } = require('./middleware/auth');
const {
  register,
  aiQueriesTotal,
  activeSessions,
  aiResponseDuration,
  httpMetricsMiddleware,
  connectionDropsCounter,
} = require('./middleware/metrics');

const app = express();

/* ---------------- AI SERVICE INIT ---------------- */

aiService.initializeAI();

/* ---------------- MIDDLEWARE ---------------- */

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://brainbytes-frontend-production.up.railway.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.railway.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed'), false);
    },
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

// Track HTTP metrics for every request
app.use(httpMetricsMiddleware);

/* ---------------- BASIC ROUTES ---------------- */

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;

  res.status(state === 1 ? 200 : 500).json({
    status: state === 1 ? 'ok' : 'error',
    db: state === 1 ? 'connected' : 'disconnected',
    databaseConnected: state === 1,
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

/* ---------------- ROUTE MODULES ---------------- */

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/materials', requireAuth, materialRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/activity', requireAuth, activityRoutes);

/* ---------------- CHAT MESSAGE ENDPOINT ---------------- */

app.post('/api/messages', async (req, res) => {
  try {
    const { text, sessionId = 'legacy', subject = 'general', skipSave = false } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Track active session
    activeSessions.inc();

    // Time the AI response
    const end = aiResponseDuration.startTimer();
    const aiResult = await aiService.generateResponse(text);
    end({ category: aiResult.category || 'general' });

    // Count the query
    aiQueriesTotal.inc({
      category: aiResult.category || 'general',
      status: 'success',
    });

    const isDbConnected = mongoose.connection.readyState === 1;
    const shouldSkipSave = skipSave || !isDbConnected;

    if (shouldSkipSave) {
      activeSessions.dec();
      return res.status(200).json({
        userMessage: {
          _id: `user-${Date.now()}`,
          text,
          sender: 'user',
          sessionId,
          subject,
          timestamp: new Date(),
        },
        aiMessage: {
          _id: `ai-${Date.now()}`,
          text: aiResult.response,
          sender: 'ai',
          sessionId,
          subject: aiResult.category || subject,
          timestamp: new Date(),
        },
        category: aiResult.category,
      });
    }

    const userMessage = await Message.create({
      text,
      sender: 'user',
      sessionId,
      subject,
      timestamp: new Date(),
    });

    const aiMessage = await Message.create({
      text: aiResult.response,
      sender: 'ai',
      sessionId,
      subject: aiResult.category || subject,
      timestamp: new Date(),
    });

    await Activity.create({
      sessionId,
      type: 'message',
      subject: aiResult.category || subject,
      summary: `Asked a ${aiResult.questionType || 'general'} question`,
    });

    activeSessions.dec();

    res.status(201).json({
      userMessage,
      aiMessage,
      category: aiResult.category,
    });
  } catch (err) {
    console.error('Error in /api/messages:', err);
    aiQueriesTotal.inc({ category: 'unknown', status: 'error' });
    activeSessions.dec();
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET CHAT HISTORY ---------------- */

app.get('/api/messages/:sessionId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
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
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const recent = await Message.find({}).sort({ timestamp: -1 }).limit(20);

    res.json(recent);
  } catch (err) {
    console.error('Error fetching activity:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- MONITORING SIMULATION ROUTES ---------------- */

app.post('/api/session/start', (req, res) => {
  activeSessions.inc();
  res.json({ success: true, message: 'Simulated session started' });
});

app.get('/api/session/start', (req, res) => {
  activeSessions.inc();
  res.json({ success: true, message: 'Simulated session started' });
});

app.post('/api/session/end', (req, res) => {
  activeSessions.dec();
  res.json({ success: true, message: 'Simulated session ended' });
});

app.get('/api/session/end', (req, res) => {
  activeSessions.dec();
  res.json({ success: true, message: 'Simulated session ended' });
});

app.post('/api/question', (req, res) => {
  res.json({ success: true, message: 'Simulated question processed' });
});

app.get('/api/question/ask', (req, res) => {
  res.json({ success: true, message: 'Simulated question asked' });
});

app.get('/api/simulate-drop', (req, res) => {
  connectionDropsCounter.inc();
  res.json({ success: true, message: 'Simulated connection drop logged' });
});

app.get('/api/simulate-error', (req, res) => {
  res.status(500).json({ error: 'Simulated internal server error' });
});

/* ---------------- 404 HANDLER ---------------- */

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;