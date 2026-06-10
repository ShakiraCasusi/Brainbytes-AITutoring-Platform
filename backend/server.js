const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const aiService = require('./aiService');
const realtime = require('./services/realtime');

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/brainbytes';

// If the server takes longer than 30 seconds to start, something went wrong — bail out cleanly.
const startupTimeout = setTimeout(() => {
  console.error('Server startup timeout - failed to start within 30 seconds');
  process.exit(1);
}, 30000);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    clearTimeout(startupTimeout);
    console.log('✓ Connected to MongoDB');

    // Try to start the AI service. If it fails, just log a warning — the server keeps running.
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

    // Same here for WebSocket/realtime — a hiccup here won't take the whole server down.
    try {
      if (typeof realtime.initializeRealtime === 'function') {
        realtime.initializeRealtime(server);
        console.log('✓ Realtime service initialized');
      } else {
        console.warn(
          '⚠ realtime.initializeRealtime not found — skipping realtime init'
        );
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

// Catch any unexpected errors that slipped through and shut down gracefully.
process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Catch any forgotten async errors (missing .catch()) and exit safely.
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection:', reason);
  process.exit(1);
});
