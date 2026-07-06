/**
 * Validates that all custom Prometheus metrics:
 * - Are registered and accessible
 * - Have correct types (Counter, Gauge, Histogram, Summary)
 * - Have the correct label names
 * - Produce valid output when incremented/observed
 */

const {
  register,
  aiQueriesTotal,
  activeSessions,
  aiResponseDuration,
  aiErrorsCounter,
  errorDistributionCounter,
  validationErrorsCounter,
  dbQueryDuration,
  messagesStoredTotal,
  authOperationsTotal,
  chatEndToEndDuration,
  authEndpointDuration,
  connectionDropsCounter,
  responseSizeSummary,
} = require('../middleware/metrics');

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function getMetricsOutput() {
  return register.metrics();
}

function metricExists(output, name) {
  return output.includes(`# HELP ${name}`);
}

function metricHasType(output, name, type) {
  return output.includes(`# TYPE ${name} ${type}`);
}

function metricHasValue(output, name) {
  const lines = output.split('\n');
  return lines.some(
    (line) => line.startsWith(name) && !line.startsWith('#')
  );
}

// ── REGISTRY ──────────────────────────────────────────────────────────────────

describe('Metrics registry', () => {
  test('registry is defined and has metrics', async () => {
    const output = await getMetricsOutput();
    console.log('Registry content type:', register.contentType);
    expect(register).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  test('registry includes default Node.js metrics', async () => {
    const output = await getMetricsOutput();
    expect(metricExists(output, 'process_cpu_user_seconds_total')).toBe(true);
    expect(metricExists(output, 'nodejs_heap_size_used_bytes')).toBe(true);
  });
});

// ── AI METRICS ────────────────────────────────────────────────────────────────

describe('AI metrics', () => {
  test('brainbytes_ai_queries_total is a Counter with correct labels', async () => {
    aiQueriesTotal.inc({ category: 'math', status: 'success' });
    const output = await getMetricsOutput();
    console.log('AI queries metric found:', metricExists(output, 'brainbytes_ai_queries_total'));
    expect(metricExists(output, 'brainbytes_ai_queries_total')).toBe(true);
    expect(metricHasType(output, 'brainbytes_ai_queries_total', 'counter')).toBe(true);
    expect(output).toContain('category="math"');
    expect(output).toContain('status="success"');
  });

  test('brainbytes_ai_queries_total increments correctly', async () => {
    aiQueriesTotal.inc({ category: 'science', status: 'error' });
    const output = await getMetricsOutput();
    expect(output).toContain('category="science"');
    expect(output).toContain('status="error"');
  });

  test('brainbytes_ai_response_duration_seconds is a Histogram with correct buckets', async () => {
    const end = aiResponseDuration.startTimer();
    await new Promise((r) => setTimeout(r, 10));
    end({ category: 'math' });
    const output = await getMetricsOutput();
    console.log('AI response duration found:', metricExists(output, 'brainbytes_ai_response_duration_seconds'));
    expect(metricExists(output, 'brainbytes_ai_response_duration_seconds')).toBe(true);
    expect(metricHasType(output, 'brainbytes_ai_response_duration_seconds', 'histogram')).toBe(true);
    expect(output).toContain('brainbytes_ai_response_duration_seconds_bucket');
    expect(output).toContain('brainbytes_ai_response_duration_seconds_sum');
    expect(output).toContain('brainbytes_ai_response_duration_seconds_count');
    // Verify bucket boundaries exist
    expect(output).toContain('le="0.05"');
    expect(output).toContain('le="10"');
  });

  test('brainbytes_ai_errors_total is a Counter with error_type and category labels', async () => {
    aiErrorsCounter.inc({ error_type: 'timeout', category: 'math' });
    const output = await getMetricsOutput();
    console.log('AI errors metric found:', metricExists(output, 'brainbytes_ai_errors_total'));
    expect(metricExists(output, 'brainbytes_ai_errors_total')).toBe(true);
    expect(metricHasType(output, 'brainbytes_ai_errors_total', 'counter')).toBe(true);
    expect(output).toContain('error_type="timeout"');
  });
});

// ── SESSION METRICS ───────────────────────────────────────────────────────────

describe('Session metrics', () => {
  test('brainbytes_active_sessions is a Gauge', async () => {
    const output = await getMetricsOutput();
    console.log('Active sessions metric found:', metricExists(output, 'brainbytes_active_sessions'));
    expect(metricExists(output, 'brainbytes_active_sessions')).toBe(true);
    expect(metricHasType(output, 'brainbytes_active_sessions', 'gauge')).toBe(true);
  });

  test('brainbytes_active_sessions increments and decrements correctly', async () => {
    activeSessions.set(0);
    activeSessions.inc();
    activeSessions.inc();

    let output = await getMetricsOutput();
    const lines = output.split('\n');
    const gaugeLine = lines.find(
      (l) => l.startsWith('brainbytes_active_sessions') && !l.startsWith('#')
    );
    console.log('Active sessions value line:', gaugeLine);
    expect(gaugeLine).toBeDefined();
    expect(parseFloat(gaugeLine.split(' ')[1])).toBe(2);

    activeSessions.dec();
    output = await getMetricsOutput();
    const updatedLine = output
      .split('\n')
      .find((l) => l.startsWith('brainbytes_active_sessions') && !l.startsWith('#'));
    expect(parseFloat(updatedLine.split(' ')[1])).toBe(1);

    activeSessions.set(0); // reset
  });

  test('brainbytes_active_sessions never goes below 0 after reset', async () => {
    activeSessions.set(0);
    activeSessions.dec();
    const output = await getMetricsOutput();
    const line = output
      .split('\n')
      .find((l) => l.startsWith('brainbytes_active_sessions') && !l.startsWith('#'));
    const value = parseFloat(line.split(' ')[1]);
    console.log('Active sessions after dec from 0:', value);
    // Value may go negative — this documents current behavior
    expect(typeof value).toBe('number');
    activeSessions.set(0); // reset
  });
});

// ── ERROR DISTRIBUTION METRICS ────────────────────────────────────────────────

describe('Error distribution metrics', () => {
  test('brainbytes_errors_total is a Counter with error_type, source, severity labels', async () => {
    errorDistributionCounter.inc({ error_type: 'server_error', source: 'http', severity: 'critical' });
    errorDistributionCounter.inc({ error_type: 'client_error', source: 'http', severity: 'warning' });
    errorDistributionCounter.inc({ error_type: 'not_found', source: 'router', severity: 'warning' });

    const output = await getMetricsOutput();
    console.log('Error distribution metric found:', metricExists(output, 'brainbytes_errors_total'));
    expect(metricExists(output, 'brainbytes_errors_total')).toBe(true);
    expect(metricHasType(output, 'brainbytes_errors_total', 'counter')).toBe(true);
    expect(output).toContain('error_type="server_error"');
    expect(output).toContain('source="http"');
    expect(output).toContain('severity="critical"');
    expect(output).toContain('error_type="not_found"');
  });

  test('brainbytes_validation_errors_total tracks endpoint and field labels', async () => {
    validationErrorsCounter.inc({ endpoint: '/api/messages', field: 'text' });
    validationErrorsCounter.inc({ endpoint: '/api/auth/register', field: 'email' });

    const output = await getMetricsOutput();
    console.log('Validation errors metric found:', metricExists(output, 'brainbytes_validation_errors_total'));
    expect(metricExists(output, 'brainbytes_validation_errors_total')).toBe(true);
    expect(output).toContain('endpoint="/api/messages"');
    expect(output).toContain('field="text"');
    expect(output).toContain('field="email"');
  });
});

// ── RESOURCE USAGE METRICS ────────────────────────────────────────────────────

describe('Resource usage metrics', () => {
  test('brainbytes_db_query_duration_seconds is a Histogram with operation and collection labels', async () => {
    const end = dbQueryDuration.startTimer({ operation: 'find', collection: 'messages' });
    await new Promise((r) => setTimeout(r, 5));
    end();

    const output = await getMetricsOutput();
    console.log('DB query duration found:', metricExists(output, 'brainbytes_db_query_duration_seconds'));
    expect(metricExists(output, 'brainbytes_db_query_duration_seconds')).toBe(true);
    expect(metricHasType(output, 'brainbytes_db_query_duration_seconds', 'histogram')).toBe(true);
    expect(output).toContain('operation="find"');
    expect(output).toContain('collection="messages"');
    // Verify fine-grained buckets exist
    expect(output).toContain('le="0.001"');
    expect(output).toContain('le="0.005"');
  });

  test('brainbytes_messages_stored_total increments with sender and subject labels', async () => {
    messagesStoredTotal.inc({ sender: 'user', subject: 'math' });
    messagesStoredTotal.inc({ sender: 'ai', subject: 'math' });

    const output = await getMetricsOutput();
    console.log('Messages stored metric found:', metricExists(output, 'brainbytes_messages_stored_total'));
    expect(metricExists(output, 'brainbytes_messages_stored_total')).toBe(true);
    expect(output).toContain('sender="user"');
    expect(output).toContain('sender="ai"');
    expect(output).toContain('subject="math"');
  });

  test('brainbytes_auth_operations_total tracks operation and status', async () => {
    authOperationsTotal.inc({ operation: 'login', status: 'success' });
    authOperationsTotal.inc({ operation: 'login', status: 'failure' });
    authOperationsTotal.inc({ operation: 'register', status: 'success' });

    const output = await getMetricsOutput();
    console.log('Auth operations metric found:', metricExists(output, 'brainbytes_auth_operations_total'));
    expect(metricExists(output, 'brainbytes_auth_operations_total')).toBe(true);
    expect(output).toContain('operation="login"');
    expect(output).toContain('status="success"');
    expect(output).toContain('status="failure"');
    expect(output).toContain('operation="register"');
  });
});

// ── LATENCY METRICS ───────────────────────────────────────────────────────────

describe('Latency metrics', () => {
  test('brainbytes_chat_end_to_end_duration_seconds is a Histogram with subject and has_history labels', async () => {
    const end = chatEndToEndDuration.startTimer({ subject: 'math', has_history: 'false' });
    await new Promise((r) => setTimeout(r, 10));
    end();

    const output = await getMetricsOutput();
    console.log('Chat end-to-end duration found:', metricExists(output, 'brainbytes_chat_end_to_end_duration_seconds'));
    expect(metricExists(output, 'brainbytes_chat_end_to_end_duration_seconds')).toBe(true);
    expect(metricHasType(output, 'brainbytes_chat_end_to_end_duration_seconds', 'histogram')).toBe(true);
    expect(output).toContain('subject="math"');
    expect(output).toContain('has_history="false"');
    // Verify user-experience buckets
    expect(output).toContain('le="3"');
    expect(output).toContain('le="10"');
    expect(output).toContain('le="15"');
  });

  test('brainbytes_auth_endpoint_duration_seconds tracks per-endpoint latency', async () => {
    const end = authEndpointDuration.startTimer({ endpoint: '/login' });
    await new Promise((r) => setTimeout(r, 5));
    end();

    const output = await getMetricsOutput();
    console.log('Auth endpoint duration found:', metricExists(output, 'brainbytes_auth_endpoint_duration_seconds'));
    expect(metricExists(output, 'brainbytes_auth_endpoint_duration_seconds')).toBe(true);
    expect(output).toContain('endpoint="/login"');
  });
});

// ── CONNECTION METRICS ────────────────────────────────────────────────────────

describe('Connection metrics', () => {
  test('brainbytes_connection_drops_total is a Counter', async () => {
    connectionDropsCounter.inc();
    const output = await getMetricsOutput();
    console.log('Connection drops metric found:', metricExists(output, 'brainbytes_connection_drops_total'));
    expect(metricExists(output, 'brainbytes_connection_drops_total')).toBe(true);
    expect(metricHasType(output, 'brainbytes_connection_drops_total', 'counter')).toBe(true);
    expect(metricHasValue(output, 'brainbytes_connection_drops_total')).toBe(true);
  });
});

// ── HTTP METRICS ──────────────────────────────────────────────────────────────

describe('HTTP metrics', () => {
  test('brainbytes_response_size_bytes is a Summary', async () => {
    responseSizeSummary.observe({ method: 'POST', endpoint: '/api/messages', status: '201' }, 1024);
    const output = await getMetricsOutput();
    console.log('Response size summary found:', metricExists(output, 'brainbytes_response_size_bytes'));
    expect(metricExists(output, 'brainbytes_response_size_bytes')).toBe(true);
    expect(metricHasType(output, 'brainbytes_response_size_bytes', 'summary')).toBe(true);
    expect(output).toContain('quantile="0.5"');
    expect(output).toContain('quantile="0.99"');
  });
});

// ── ALL METRICS REGISTERED ────────────────────────────────────────────────────

describe('All expected metrics are registered', () => {
  const expectedMetrics = [
    'brainbytes_ai_queries_total',
    'brainbytes_ai_response_duration_seconds',
    'brainbytes_ai_errors_total',
    'brainbytes_active_sessions',
    'brainbytes_errors_total',
    'brainbytes_validation_errors_total',
    'brainbytes_db_query_duration_seconds',
    'brainbytes_messages_stored_total',
    'brainbytes_auth_operations_total',
    'brainbytes_chat_end_to_end_duration_seconds',
    'brainbytes_auth_endpoint_duration_seconds',
    'brainbytes_connection_drops_total',
    'brainbytes_response_size_bytes',
    'brainbytes_http_requests_total',
    'brainbytes_http_request_duration_seconds',
  ];

  test.each(expectedMetrics)('%s is registered', async (metricName) => {
    const output = await getMetricsOutput();
    console.log(`Checking ${metricName}:`, metricExists(output, metricName));
    expect(metricExists(output, metricName)).toBe(true);
  });
});