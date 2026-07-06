# BrainBytes Metrics Catalog & Query Reference Guide

This document is the canonical reference catalog for all custom Prometheus metrics instrumented inside the **BrainBytes AI Tutoring Platform**. It details the calculation methods, labels, normal operating ranges, anomaly indicators, and PromQL query examples.

---

## 📊 Application Metrics Catalog

### 1. HTTP Network Interface Metrics

#### `brainbytes_http_requests_total`
* **Type:** Counter
* **Description:** Tracks the cumulative count of HTTP requests handled by the primary backend server.
* **Labels:** `method` (GET, POST), `endpoint` (e.g. `/api/question`), `status` (HTTP status code), `user_agent` (Desktop/Mobile).
* **Calculation:** Incremented on the HTTP response `finish` event inside the Express metrics middleware.
* **Normal range:** Varies by active student load. Success rates (`2xx`) should remain >95%.
* **Anomaly indicator:** Sudden spikes in `5xx` status codes (>5% warning threshold, >15% critical threshold) indicating server code crashes.
* **PromQL example:**
  ```promql
  sum(rate(brainbytes_http_requests_total[5m])) by (endpoint)
  ```

#### `brainbytes_http_request_duration_seconds`
* **Type:** Histogram
* **Description:** Measures response latency for HTTP requests.
* **Buckets:** `0.01`, `0.05`, `0.1`, `0.5`, `1`, `2`, `5` seconds.
* **Labels:** `method`, `endpoint`, `status`, `user_agent`.
* **Calculation:** Timestamp difference from request receipt to response transmission.
* **Normal range:** p95 latency < 2 seconds for desktop clients.
* **Anomaly indicator:** p95 HTTP response duration > 2 seconds for 5 minutes (triggers `SlowResponses` warning).
* **PromQL example:**
  ```promql
  histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket[5m])) by (le))
  ```

#### `brainbytes_response_size_bytes`
* **Type:** Summary
* **Description:** Records the payload size of responses in bytes to track outbound bandwidth consumption (Philippine prepaid data optimization).
* **Labels:** `method`, `endpoint`, `status`.
* **Calculation:** Extracted from the HTTP `Content-Length` header on response finish.
* **Normal range:** API JSON payloads should average <10 KB.
* **Anomaly indicator:** Outbound volume exceeding 50 MB in an hour (triggers `HighDataUsage` alert).
* **PromQL example:**
  ```promql
  sum(increase(brainbytes_response_size_bytes_sum[1h])) / (1024 * 1024)
  ```

---

### 2. AI Tutoring Service Metrics

#### `brainbytes_ai_queries_total`
* **Type:** Counter
* **Description:** Counts the number of AI hint classifications processed.
* **Labels:** `category` (math, science, general, history, error), `status` (success, error).
* **Calculation:** Incremented once per AI classification call inside the Hugging Face service router.
* **Normal range:** Grows proportionally to user active sessions. Success rate should be >95%.
* **Anomaly indicator:** AI error rate >5% (warning), >20% (critical) indicating API blockages.
* **PromQL example:**
  ```promql
  rate(brainbytes_ai_queries_total{status="error"}[5m]) / rate(brainbytes_ai_queries_total[5m])
  ```

#### `brainbytes_ai_response_duration_seconds`
* **Type:** Histogram
* **Description:** Tracks response generation time for Hugging Face tutoring hints.
* **Buckets:** `0.05`, `0.1`, `0.25`, `0.5`, `1`, `2`, `5`, `10` seconds.
* **Labels:** `category`.
* **Calculation:** Time elapsed during the asynchronous Hugging Face pipeline call.
* **Normal range:** p50 < 1.5s, p95 < 3s.
* **Anomaly indicator:** p95 latency > 3s (warning), >8s (critical timeout condition).
* **PromQL example:**
  ```promql
  histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))
  ```

#### `brainbytes_ai_errors_total`
* **Type:** Counter
* **Description:** Tracks AI-specific service failures by category.
* **Labels:** `error_type` (timeout, service_error), `category`.
* **Calculation:** Incremented on HuggingFace api catch blocks.
* **Normal range:** Should be 0.
* **Anomaly indicator:** Timeout rate high (>0.1/s) indicating Hugging Face outage or key rate limiting.
* **PromQL example:**
  ```promql
  rate(brainbytes_ai_errors_total{error_type="timeout"}[5m])
  ```

---

### 3. Business & UX Metrics

#### `brainbytes_active_sessions`
* **Type:** Gauge
* **Description:** Tracks the current number of concurrent active student tutoring sessions.
* **Labels:** *None*.
* **Calculation:** Incremented at `/api/session/start`, decremented at `/api/session/end`.
* **Normal range:** 1 to 20 during local Philippine study hours.
* **Anomaly indicator:** Dropping to exactly 0 for 30 minutes (triggers `NoActiveSessions` availability warning).
* **PromQL example:**
  ```promql
  brainbytes_active_sessions
  ```

#### `brainbytes_chat_end_to_end_duration_seconds`
* **Type:** Histogram
* **Description:** Measures end-to-end user chat latency from request receipt to response completion.
* **Buckets:** `0.1`, `0.25`, `0.5`, `1`, `2`, `3`, `5`, `10`, `15` seconds.
* **Labels:** `subject`, `has_history` (true/false).
* **Calculation:** Timer started before query processing, stopped after final DB write and express response completion.
* **Normal range:** p90 latency < 4 seconds.
* **Anomaly indicator:** p90 latency > 4 seconds (warning), >10 seconds (critical).
* **PromQL example:**
  ```promql
  histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))
  ```

#### `brainbytes_connection_drops_total`
* **Type:** Counter
* **Description:** Counts network dropouts and client reconnect retries (mobile cell network instability indicator).
* **Labels:** *None*.
* **Calculation:** Incremented when a client requests network recovery endpoints after connection disruption.
* **Normal range:** Low (<5 drops per minute in aggregate).
* **Anomaly indicator:** Sudden rise >5 drops/minute (triggers `NetworkInstability` warning).
* **PromQL example:**
  ```promql
  rate(brainbytes_connection_drops_total[5m])
  ```

---

### 4. Database & Internal Resource Metrics

#### `brainbytes_db_query_duration_seconds`
* **Type:** Histogram
* **Description:** Tracks MongoDB Atlas transaction duration.
* **Buckets:** `0.001`, `0.005`, `0.01`, `0.05`, `0.1`, `0.5`, `1` seconds.
* **Labels:** `operation` (find, insertOne), `collection` (messages, sessions).
* **Calculation:** Timer wrapped around Mongoose query lifecycle steps.
* **Normal range:** p95 query latency < 50ms.
* **Anomaly indicator:** p95 query latency > 100ms (warning), >500ms (critical database choke).
* **PromQL example:**
  ```promql
  histogram_quantile(0.95, rate(brainbytes_db_query_duration_seconds_bucket[5m]))
  ```

#### `brainbytes_errors_total`
* **Type:** Counter
* **Description:** Core error distribution tracker grouping errors by type, source, and severity.
* **Labels:** `error_type` (server_error, client_error, validation_error, db_error), `source` (http, ai_service, db), `severity` (warning, critical).
* **Calculation:** Incremented on any server exception handler path.
* **Normal range:** Varies. Occasional validation or client errors are expected.
* **Anomaly indicator:** Critical error rate spike >0.5/s.
* **PromQL example:**
  ```yt
  sum by (error_type, severity) (rate(brainbytes_errors_total[5m]))
  ```

#### `brainbytes_validation_errors_total`
* **Type:** Counter
* **Description:** Counts API input schema validation failures.
* **Labels:** `endpoint`, `field`.
* **Calculation:** Incremented inside Request validation middleware.
* **Normal range:** Low (<1% of traffic).
* **Anomaly indicator:** Spikes in input errors indicating a frontend API client mismatch.
* **PromQL example:**
  ```promql
  sum(rate(brainbytes_validation_errors_total[5m])) by (endpoint, field)
  ```

---

## 📈 Top 10 Reference Queries for Health Auditing

1. **Endpoint Throughput Rate:**
   `sum(rate(brainbytes_http_requests_total[5m])) by (endpoint)`
2. **HTTP 5xx Server Error Percentage:**
   `(sum(rate(brainbytes_http_requests_total{status=~"5.*"}[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100`
3. **95th Percentile HTTP Response Latency:**
   `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket[5m])) by (le))`
4. **Mobile User p95 Response Latency:**
   `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m])) by (le))`
5. **AI Queries Throughput by Subject Category:**
   `sum(rate(brainbytes_ai_queries_total[5m])) by (category)`
6. **Average AI Classification Latency:**
   `rate(brainbytes_ai_response_duration_seconds_sum[5m]) / rate(brainbytes_ai_response_duration_seconds_count[5m])`
7. **Current Concurrent Tutoring Sessions:**
   `brainbytes_active_sessions`
8. **Network Connection Recovery Rate:**
   `rate(brainbytes_connection_drops_total[5m])`
9. **Outbound Data Payload Transfer Volume (MB/hour):**
   `sum(increase(brainbytes_response_size_bytes_sum[1h])) / (1024 * 1024)`
10. **Container Memory utilization vs Compose limits (%):**
    `(container_memory_usage_bytes{name=~"brainbytes-.*"} / container_spec_memory_limit_bytes{name=~"brainbytes-.*"}) * 100`
