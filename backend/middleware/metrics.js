const client = require('prom-client');
const express = require('express');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// ── HTTP METRICS ──────────────────────────────────────────────────────────────

const httpRequestCounter = new client.Counter({
  name: 'brainbytes_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status', 'user_agent'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'brainbytes_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint', 'status', 'user_agent'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const responseSizeSummary = new client.Summary({
  name: 'brainbytes_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

// ── SESSION METRICS ───────────────────────────────────────────────────────────

const activeSessionsGauge = new client.Gauge({
  name: 'brainbytes_active_sessions',
  help: 'Number of active tutoring sessions',
  registers: [register],
});

activeSessionsGauge.set(0);
const activeSessions = activeSessionsGauge;

// ── AI METRICS ────────────────────────────────────────────────────────────────

const aiQueriesTotal = new client.Counter({
  name: 'brainbytes_ai_queries_total',
  help: 'Total number of AI queries processed',
  labelNames: ['category', 'status'],
  registers: [register],
});

const aiResponseDuration = new client.Histogram({
  name: 'brainbytes_ai_response_duration_seconds',
  help: 'AI response time in seconds',
  labelNames: ['category'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// ── ERROR DISTRIBUTION METRICS ────────────────────────────────────────────────
// Tracks errors by type and source for distribution analysis

const errorDistributionCounter = new client.Counter({
  name: 'brainbytes_errors_total',
  help: 'Total number of errors by type and source',
  labelNames: ['error_type', 'source', 'severity'],
  registers: [register],
});

// Tracks validation errors specifically (bad input from users)
const validationErrorsCounter = new client.Counter({
  name: 'brainbytes_validation_errors_total',
  help: 'Total number of input validation errors',
  labelNames: ['endpoint', 'field'],
  registers: [register],
});

// Tracks AI-specific errors (timeout, service unavailable, bad response)
const aiErrorsCounter = new client.Counter({
  name: 'brainbytes_ai_errors_total',
  help: 'Total number of AI service errors by error type',
  labelNames: ['error_type', 'category'],
  registers: [register],
});

// ── RESOURCE USAGE METRICS ────────────────────────────────────────────────────
// Tracks backend resource consumption beyond default Node.js metrics

// Tracks database query duration
const dbQueryDuration = new client.Histogram({
  name: 'brainbytes_db_query_duration_seconds',
  help: 'MongoDB query duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Tracks number of messages stored in DB (business resource metric)
const messagesStoredTotal = new client.Counter({
  name: 'brainbytes_messages_stored_total',
  help: 'Total number of messages saved to the database',
  labelNames: ['sender', 'subject'],
  registers: [register],
});

// Tracks auth token operations
const authOperationsTotal = new client.Counter({
  name: 'brainbytes_auth_operations_total',
  help: 'Total number of auth operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// ── LATENCY PERCENTILE METRICS ────────────────────────────────────────────────
// Fine-grained latency tracking for user-facing endpoints

// Tracks end-to-end chat response latency (user sends → AI responds → saved)
const chatEndToEndDuration = new client.Histogram({
  name: 'brainbytes_chat_end_to_end_duration_seconds',
  help: 'End-to-end chat request duration from receipt to response sent',
  labelNames: ['subject', 'has_history'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 3, 5, 10, 15],
  registers: [register],
});

// Tracks auth endpoint latency separately (login, register)
const authEndpointDuration = new client.Histogram({
  name: 'brainbytes_auth_endpoint_duration_seconds',
  help: 'Auth endpoint response duration in seconds',
  labelNames: ['endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// ── CONNECTION METRICS ────────────────────────────────────────────────────────

const connectionDropsCounter = new client.Counter({
  name: 'brainbytes_connection_drops_total',
  help: 'Total number of simulated or logged connection drops',
  registers: [register],
});

// ── DEDICATED METRICS SERVER (port 9080) ─────────────────────────────────────

const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

let metricsServer = null;

function startMetricsServer(port = 9080) {
  if (process.env.NODE_ENV === 'test') return;
  if (!metricsServer) {
    metricsServer = metricsApp.listen(port, () => {
      console.log(`✓ Metrics server listening on port ${port}`);
    });
  }
  return metricsServer;
}

function stopMetricsServer() {
  if (metricsServer) {
    metricsServer.close();
    metricsServer = null;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startMetricsServer();
}

// ── HTTP MIDDLEWARE ───────────────────────────────────────────────────────────

function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const endpoint = req.route?.path || req.path || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const responseSize = parseInt(res.get('Content-Length') || '0', 10);

    httpRequestCounter.inc({
      method: req.method,
      endpoint,
      status: res.statusCode,
      user_agent: userAgent,
    });

    httpRequestDuration.observe(
      { method: req.method, endpoint, status: res.statusCode, user_agent: userAgent },
      duration
    );

    responseSizeSummary.observe(
      { method: req.method, endpoint, status: res.statusCode },
      responseSize
    );

    // Track error distribution from HTTP status codes
    if (res.statusCode >= 400) {
      const severity = res.statusCode >= 500 ? 'critical' : 'warning';
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      errorDistributionCounter.inc({
        error_type: errorType,
        source: 'http',
        severity,
      });
    }
  });

  next();
}

// ── SESSION HELPERS ───────────────────────────────────────────────────────────

function incrementActiveSessions() {
  activeSessionsGauge.inc();
}

function decrementActiveSessions() {
  activeSessionsGauge.dec();
}

module.exports = {
  register,
  // AI metrics
  aiQueriesTotal,
  activeSessions,
  aiResponseDuration,
  aiErrorsCounter,
  // Error distribution
  errorDistributionCounter,
  validationErrorsCounter,
  // Resource usage
  dbQueryDuration,
  messagesStoredTotal,
  authOperationsTotal,
  // Latency
  chatEndToEndDuration,
  authEndpointDuration,
  // Connection
  connectionDropsCounter,
  responseSizeSummary,
  // Middleware & helpers
  metricsMiddleware,
  httpMetricsMiddleware: metricsMiddleware,
  incrementActiveSessions,
  decrementActiveSessions,
  startMetricsServer,
  stopMetricsServer,
};