const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const aiService = require('./aiService');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const Message = require('./Message');
const { requireAuth } = require('./middleware/auth');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseConnected: mongoose.connection.readyState === 1,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseConnected: mongoose.connection.readyState === 1,
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/materials', requireAuth, materialRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/activity', requireAuth, activityRoutes);

app.post('/api/messages', async (req, res) => {
  try {
    const userMessage = new Message({
      text: req.body.text,
      sender: 'user',
      sessionId: 'legacy',
      timestamp: new Date(),
    });
    await userMessage.save();

    const aiResult = await aiService.generateResponse(req.body.text);

    const aiMessage = new Message({
      text: aiResult.response,
      sender: 'ai',
      sessionId: 'legacy',
      timestamp: new Date(),
    });
    await aiMessage.save();

    res.status(201).json({
      userMessage,
      aiMessage,
      category: aiResult.category,
    });
  } catch (err) {
    console.error('Error in /api/messages route:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = app;
