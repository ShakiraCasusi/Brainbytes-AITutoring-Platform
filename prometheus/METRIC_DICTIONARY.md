# BrainBytes Metric Dictionary

This document defines all custom Prometheus metrics used in the BrainBytes backend,
including calculation methods, normal ranges, and anomaly indicators.

---

## AI Metrics

### `brainbytes_ai_queries_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `category` (math, science, general, greeting, error), `status` (success, error) |
| **Calculation** | Incremented once per AI query processed in `/api/messages` and `/api/chat/send` |
| **Normal range** | Varies by traffic. Success rate should be >95% |
| **Anomaly indicator** | Error rate >5% (warning), >20% (critical) |
| **PromQL example** | `rate(brainbytes_ai_queries_total{status="error"}[5m]) / rate(brainbytes_ai_queries_total[5m])` |

---

### `brainbytes_ai_response_duration_seconds`
| Field | Value |
|-------|-------|
| **Type** | Histogram |
| **Labels** | `category` |
| **Buckets** | 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10 seconds |
| **Calculation** | Timer started before `aiService.generateResponse()`, stopped after response received |
| **Normal range** | p50 < 1s, p95 < 3s |
| **Anomaly indicator** | p95 > 3s (warning), p95 > 8s (critical) |
| **PromQL example** | `histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))` |

---

### `brainbytes_ai_errors_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `error_type` (timeout, service_error), `category` |
| **Calculation** | Incremented when AI service throws an error inside the try/catch block |
| **Normal range** | Should be 0 or near 0 |
| **Anomaly indicator** | Any timeout errors appearing consistently |
| **PromQL example** | `rate(brainbytes_ai_errors_total{error_type="timeout"}[5m])` |

---

## Error Distribution Metrics

### `brainbytes_errors_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `error_type` (server_error, client_error, validation_error, db_error, not_found, timeout), `source` (http, ai_service, api_messages, router, simulation), `severity` (warning, critical) |
| **Calculation** | Incremented on every error path — HTTP 4xx/5xx responses, AI errors, DB errors, 404s |
| **Normal range** | Client errors (4xx) may appear normally. Server errors (5xx) should be near 0 |
| **Anomaly indicator** | Critical errors > 0.5/s (critical alert), any DB errors appearing consistently |
| **PromQL example** | `sum by (error_type) (rate(brainbytes_errors_total[5m]))` |

---

### `brainbytes_validation_errors_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `endpoint`, `field` |
| **Calculation** | Incremented when request body fails validation (missing required fields) |
| **Normal range** | Low — occasional user input errors are expected |
| **Anomaly indicator** | Spike in validation errors may indicate a broken frontend or API client |
| **PromQL example** | `rate(brainbytes_validation_errors_total[5m])` |

---

## Resource Usage Metrics

### `brainbytes_db_query_duration_seconds`
| Field | Value |
|-------|-------|
| **Type** | Histogram |
| **Labels** | `operation` (find, insertOne), `collection` (messages) |
| **Buckets** | 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1 seconds |
| **Calculation** | Timer wraps each Mongoose operation (find, create) |
| **Normal range** | p95 < 50ms for indexed queries |
| **Anomaly indicator** | p95 > 100ms (warning), p95 > 500ms (critical) |
| **PromQL example** | `histogram_quantile(0.95, rate(brainbytes_db_query_duration_seconds_bucket[5m]))` |

---

### `brainbytes_messages_stored_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `sender` (user, ai), `subject` |
| **Calculation** | Incremented after each successful `Message.create()` call |
| **Normal range** | Should grow proportionally to active users. Ratio of user:ai should be ~1:1 |
| **Anomaly indicator** | Rate drops to 0 for >10 minutes during active hours |
| **PromQL example** | `rate(brainbytes_messages_stored_total[5m])` |

---

### `brainbytes_auth_operations_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `operation` (register, login, me), `status` (success, failure) |
| **Calculation** | Incremented on `res.finish` for auth routes |
| **Normal range** | Failure rate < 5% for login. Register failures may be higher (duplicate emails) |
| **Anomaly indicator** | Login failure rate > 1/s may indicate brute force attack |
| **PromQL example** | `rate(brainbytes_auth_operations_total{status="failure"}[5m])` |

---

### `brainbytes_active_sessions`
| Field | Value |
|-------|-------|
| **Type** | Gauge |
| **Labels** | None |
| **Calculation** | Incremented when a message request starts, decremented when response is sent |
| **Normal range** | 0–50 for development, scales with user count in production |
| **Anomaly indicator** | Negative value indicates inc/dec mismatch bug. Very high value may indicate hanging requests |
| **PromQL example** | `brainbytes_active_sessions` |

---

## HTTP Metrics

### `brainbytes_http_requests_total`
| Field | Value |
|-------|-------|
| **Type** | Counter |
| **Labels** | `method`, `endpoint`, `status`, `user_agent` |
| **Calculation** | Incremented on every request via `metricsMiddleware` on `res.finish` |
| **Normal range** | Varies by traffic |
| **Anomaly indicator** | Sudden spike or drop in request rate |
| **PromQL example** | `rate(brainbytes_http_requests_total[5m])` |

---

### `brainbytes_http_request_duration_seconds`
| Field | Value |
|-------|-------|
| **Type** | Histogram |
| **Labels** | `method`, `endpoint`, `status`, `user_agent` |
| **Buckets** | 0.01, 0.05, 0.1, 0.5, 1, 2, 5 seconds |
| **Calculation** | Timer started at request receipt, stopped on `res.finish` |
| **Normal range** | p95 < 500ms for non-AI endpoints, p95 < 5s for AI endpoints |
| **Anomaly indicator** | p95 > 1s for health/auth endpoints |
| **PromQL example** | `histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))` |

---

## Latency Metrics

### `brainbytes_chat_end_to_end_duration_seconds`
| Field | Value |
|-------|-------|
| **Type** | Histogram |
| **Labels** | `subject`, `has_history` |
| **Buckets** | 0.1, 0.25, 0.5, 1, 2, 3, 5, 10, 15 seconds |
| **Calculation** | Timer started at start of `/api/messages` handler, stopped just before `res.json()` — covers validation + AI call + DB saves |
| **Normal range** | p50 < 2s, p90 < 4s |
| **Anomaly indicator** | p90 > 4s (warning — users noticing), p90 > 10s (critical — users abandoning) |
| **PromQL example** | `histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))` |

---

### `brainbytes_auth_endpoint_duration_seconds`
| Field | Value |
|-------|-------|
| **Type** | Histogram |
| **Labels** | `endpoint` (register, login, me) |
| **Buckets** | 0.01, 0.05, 0.1, 0.25, 0.5, 1 seconds |
| **Calculation** | Timer wraps each auth route handler |
| **Normal range** | p95 < 200ms (login involves bcrypt which takes ~100ms) |
| **Anomaly indicator** | p95 > 500ms for auth endpoints |
| **PromQL example** | `histogram_quantile(0.95, rate(brainbytes_auth_endpoint_duration_seconds_bucket[5m]))` |

---

## Recording Rules Reference

| Rule Name | Based On | Purpose |
|-----------|----------|---------|
| `job:brainbytes_ai_response_duration_seconds:avg5m` | `aiResponseDuration` | Precomputed avg AI response time |
| `job:brainbytes_ai_response_duration_p95:5m` | `aiResponseDuration` | Precomputed p95 AI response time |
| `job:brainbytes_ai_error_rate:5m` | `aiQueriesTotal` | Precomputed AI error rate |
| `job:brainbytes_http_error_rate:5m` | `httpRequestCounter` | Precomputed HTTP error rate per endpoint |
| `job:brainbytes_http_duration_p95:5m` | `httpRequestDuration` | Precomputed p95 HTTP duration |
| `job:brainbytes_chat_duration_p90:5m` | `chatEndToEndDuration` | Precomputed p90 chat latency (SLA metric) |
| `job:brainbytes_db_query_duration_p95:5m` | `dbQueryDuration` | Precomputed p95 DB query time |

---

## Alert Thresholds Summary

| Alert | Warning | Critical | Evaluation |
|-------|---------|----------|------------|
| AI error rate | >5% | >20% | 2m |
| AI response p95 | >3s | >8s | 2m |
| HTTP error rate | >5% | >15% | 2m |
| DB query p95 | >100ms | >500ms | 3m |
| Chat end-to-end p90 | >4s | >10s | 3m / 2m |
| Auth failure rate | >1/s | — | 2m |
| Server error rate | — | >0.5/s | 1m |
| AI service degradation | — | >30% error category | 5m |