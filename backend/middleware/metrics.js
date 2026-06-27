const client = require('prom-client');

// Collect default Node.js metrics (memory, CPU, event loop lag, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ── COUNTER ───────────────────────────────────────────────────────────────────
// Tracks total number of AI queries processed, labelled by category and status.
const aiQueriesTotal = new client.Counter({
  name: 'brainbytes_ai_queries_total',
  help: 'Total number of AI queries processed',
  labelNames: ['category', 'status'],
  registers: [register],
});

// ── GAUGE ─────────────────────────────────────────────────────────────────────
// Tracks how many chat sessions are currently active.
const activeSessions = new client.Gauge({
  name: 'brainbytes_active_sessions',
  help: 'Number of currently active chat sessions',
  registers: [register],
});

// ── HISTOGRAM ─────────────────────────────────────────────────────────────────
// Measures AI response time in seconds, bucketed for percentile analysis.
const aiResponseDuration = new client.Histogram({
  name: 'brainbytes_ai_response_duration_seconds',
  help: 'AI response time in seconds',
  labelNames: ['category'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// ── HTTP REQUEST COUNTER ──────────────────────────────────────────────────────
// Tracks total HTTP requests by method, route, and status code.
const httpRequestsTotal = new client.Counter({
  name: 'brainbytes_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ── HTTP REQUEST DURATION ─────────────────────────────────────────────────────
// Measures HTTP request duration in seconds.
const httpRequestDuration = new client.Histogram({
  name: 'brainbytes_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
// Automatically tracks HTTP request count and duration for every route.
function httpMetricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
  });

  next();
}

module.exports = {
  register,
  aiQueriesTotal,
  activeSessions,
  aiResponseDuration,
  httpRequestsTotal,
  httpRequestDuration,
  httpMetricsMiddleware,
};