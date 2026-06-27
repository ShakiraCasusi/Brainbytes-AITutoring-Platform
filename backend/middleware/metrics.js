const client = require('prom-client');
const express = require('express');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Create custom metrics (updated for homework with user_agent label)
const httpRequestCounter = new client.Counter({
  name: 'brainbytes_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status', 'user_agent'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'brainbytes_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint', 'status', 'user_agent'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeSessionsGauge = new client.Gauge({
  name: 'brainbytes_active_sessions',
  help: 'Number of active tutoring sessions',
  registers: [register]
});

// Homework Task: Add Filipino-specific metrics (Payload size summary, drop counter)
const responseSizeSummary = new client.Summary({
  name: 'brainbytes_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register]
});

const connectionDropsCounter = new client.Counter({
  name: 'brainbytes_connection_drops_total',
  help: 'Total number of simulated or logged connection drops',
  registers: [register]
});

// Maintain compatibility with existing backend/app.js AI metrics
const aiQueriesTotal = new client.Counter({
  name: 'brainbytes_ai_queries_total',
  help: 'Total number of AI queries processed',
  labelNames: ['category', 'status'],
  registers: [register]
});

const aiResponseDuration = new client.Histogram({
  name: 'brainbytes_ai_response_duration_seconds',
  help: 'AI response time in seconds',
  labelNames: ['category'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Initialize with 0 active sessions
activeSessionsGauge.set(0);
const activeSessions = activeSessionsGauge; // Alias for app.js

// Export metrics endpoint on a dedicated metrics server (port 9080)
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Start metrics server
metricsApp.listen(9080, () => {
  console.log('✓ Metrics server listening on port 9080');
});

// Middleware to track HTTP requests in your main app
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const endpoint = req.route?.path || req.path || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Attempt to calculate response size in bytes
    const responseSize = parseInt(res.get('Content-Length') || '0', 10);
    
    // Record HTTP metrics
    httpRequestCounter.inc({
      method: req.method,
      endpoint: endpoint,
      status: res.statusCode,
      user_agent: userAgent
    });
    
    httpRequestDuration.observe({
      method: req.method,
      endpoint: endpoint,
      status: res.statusCode,
      user_agent: userAgent
    }, duration);

    // Record response size metric
    responseSizeSummary.observe({
      method: req.method,
      endpoint: endpoint,
      status: res.statusCode
    }, responseSize);
  });
  
  next();
}

// Functions to track active sessions
function incrementActiveSessions() {
  activeSessionsGauge.inc();
}

function decrementActiveSessions() {
  activeSessionsGauge.dec();
}

module.exports = {
  register,
  aiQueriesTotal,
  activeSessions,
  aiResponseDuration,
  metricsMiddleware,
  httpMetricsMiddleware: metricsMiddleware, // Alias for app.js
  incrementActiveSessions,
  decrementActiveSessions,
  connectionDropsCounter,
  responseSizeSummary
};