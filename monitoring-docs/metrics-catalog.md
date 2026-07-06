# Metrics Catalog & Query Reference Guide

This document catalogs all custom application metrics and provides 10 key PromQL queries for auditing the health of the **BrainBytes AI Tutoring Platform**.

---

## Metrics Catalog

### 1. Application Domain
| Metric Name | Type | Description | Labels | Example Query |
| :--- | :--- | :--- | :--- | :--- |
| `brainbytes_http_requests_total` | Counter | Tracks cumulative count of HTTP requests handled by the primary server. | `method`, `endpoint`, `status`, `user_agent` | `sum(rate(brainbytes_http_requests_total[5m]))` |
| `brainbytes_http_request_duration_seconds` | Histogram | Measures the response latency for HTTP requests. | `method`, `endpoint`, `status`, `user_agent` | `histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))` |
| `brainbytes_ai_queries_total` | Counter | Counts the number of AI classifications processed. | `category`, `status` | `sum(rate(brainbytes_ai_queries_total{status="success"}[5m]))` |
| `brainbytes_ai_response_duration_seconds` | Histogram | Tracks response generation time for Hugging Face tutoring hints. | `category` | `histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))` |

### 2. Business Domain
| Metric Name | Type | Description | Labels | Example Query |
| :--- | :--- | :--- | :--- | :--- |
| `brainbytes_active_sessions` | Gauge | Represents the current number of concurrent active tutoring sessions. | *None* | `brainbytes_active_sessions` |

### 3. Philippine Context Domain
| Metric Name | Type | Description | Labels | Example Query |
| :--- | :--- | :--- | :--- | :--- |
| `brainbytes_response_size_bytes` | Summary | Records the payload size of responses in bytes to track bandwidth impact. | `method`, `endpoint`, `status` | `sum(increase(brainbytes_response_size_bytes_sum[1h]))` |
| `brainbytes_connection_drops_total` | Counter | Counts simulated or caught network connection drop-outs. | *None* | `increase(brainbytes_connection_drops_total[1h])` |

---

## Query Reference Guide

Here are 10 PromQL queries to monitor, analyze, and troubleshoot the application.

### 1. HTTP Request Rate per Endpoint
- **Query:** `sum(rate(brainbytes_http_requests_total[5m])) by (endpoint)`
- **Description:** Precomputes the throughput of incoming queries to various routes over the last 5 minutes.
- **Interpretation:** Helps identify which API routes are hot (e.g. `/api/question` vs `/api/auth`) to adjust API rate-limits.

### 2. HTTP Error Rate Ratio (Percentage)
- **Query:** `(sum(rate(brainbytes_http_requests_total{status=~"5.*"}[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100`
- **Description:** Calculates the percentage of requests returning `5xx` internal server errors.
- **Interpretation:** Values above `0%` indicate backend bugs, database failures, or API timeouts. A value > `5%` triggers the `HighErrorRate` critical alert.

### 3. 95th Percentile HTTP Response Latency
- **Query:** `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket[5m])) by (le))`
- **Description:** Calculates the maximum time (in seconds) that `95%` of users waited for their requests to complete.
- **Interpretation:** If the 95th percentile is under 0.5s, the application feels fast. If it rises above 2s, users will experience noticeable lag.

### 4. 95th Percentile Response Latency for Mobile Users
- **Query:** `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m])) by (le))`
- **Description:** Isolates the latency of requests made from mobile devices (Android/iOS).
- **Interpretation:** Essential for the Philippine context where 3G/4G/5G connections have higher TCP handshake latencies. Helps optimize frontend bundles specifically for mobile.

### 5. AI Query Processing Rate
- **Query:** `sum(rate(brainbytes_ai_queries_total[5m])) by (category)`
- **Description:** Measures the speed at which Hugging Face classifications are requested per subject.
- **Interpretation:** Showcases user interest trends (e.g. math queries vs science queries) and helps optimize backend caching for popular topics.

### 6. Average AI Generation Latency
- **Query:** `rate(brainbytes_ai_response_duration_seconds_sum[5m]) / rate(brainbytes_ai_response_duration_seconds_count[5m])`
- **Description:** Precomputes average seconds spent waiting for Hugging Face APIs to resolve queries.
- **Interpretation:** Average latency should remain under 3s. Spikes suggest Hugging Face service degradation or token rate-limiting.

### 7. Active Tutoring Sessions Profile
- **Query:** `brainbytes_active_sessions`
- **Description:** A point-in-time gauge showing current active tutoring sessions.
- **Interpretation:** Directly measures engagement. Flatlining at `0` for more than 30 minutes during local Philippine school hours triggers a `NoActiveSessions` business warning.

### 8. Network Connection Drops Over the Last Hour
- **Query:** `increase(brainbytes_connection_drops_total[1h])`
- **Description:** Returns the total count of network drops logged by client endpoints over the past hour.
- **Interpretation:** High values (> 5/hour) signify that users are attempting to study under highly unstable mobile network cells, requiring the application to save local drafts more frequently.

### 9. Outbound Data Payload Volume (MB/hour)
- **Query:** `sum(increase(brainbytes_response_size_bytes_sum[1h])) / (1024 * 1024)`
- **Description:** Computes the total megabytes of data transferred by the backend container to clients in the past hour.
- **Interpretation:** Essential to monitor to prevent hitting cloud bandwidth caps and to optimize response payload sizes (compressing JSON schemas, disabling heavy images) for mobile-first users.

### 10. Container Memory Usage Percentage
- **Query:** `(container_memory_usage_bytes{name=~"brainbytes-.*"} / container_spec_memory_limit_bytes{name=~"brainbytes-.*"}) * 100`
- **Description:** Calculates RAM utilization against the container's hard limit configured in docker-compose.
- **Interpretation:** Values above 85% suggest container bloat or Node.js memory leaks, warning the infrastructure of a potential Out-of-Memory (OOM) termination.
