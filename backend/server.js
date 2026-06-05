const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const aiService = require('./aiService');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const realtime = require('./services/realtime');
const Message = require('./Message');
const { requireAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/brainbytes';

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

// MOVE service initialization to after MongoDB connection
// aiService.initializeAI();
// realtime.initializeRealtime(server);

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

// Set a startup timeout to prevent hanging
const startupTimeout = setTimeout(() => {
  console.error('Server startup timeout - failed to start within 30 seconds');
  process.exit(1);
}, 30000);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    clearTimeout(startupTimeout);
    console.log('✓ Connected to MongoDB');

    // Initialize AI service (non-fatal — server still starts if this fails)
    try {
      if (typeof aiService.initializeAI === 'function') {
        aiService.initializeAI();
        console.log('✓ AI service initialized');
      } else {
        console.warn('⚠ aiService.initializeAI not found — skipping AI init');
      }
    } catch (err) {
      console.warn('⚠ AI service init failed (non-fatal):', err.message);
    }

    // Initialize realtime service (non-fatal — server still starts if this fails)
    try {
      if (typeof realtime.initializeRealtime === 'function') {
        realtime.initializeRealtime(server);
        console.log('✓ Realtime service initialized');
      } else {
        console.warn('⚠ realtime.initializeRealtime not found — skipping realtime init');
      }
    } catch (err) {
      console.warn('⚠ Realtime service init failed (non-fatal):', err.message);
    }

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    clearTimeout(startupTimeout);
    console.error('✗ Failed to connect to MongoDB:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection:', reason);
  process.exit(1);
});
