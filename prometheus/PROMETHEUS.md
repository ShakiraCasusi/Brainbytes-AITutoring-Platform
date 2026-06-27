# BrainBytes Prometheus Monitoring

## Custom Metrics

### 1. Counter — `brainbytes_ai_queries_total`
Tracks the total number of AI queries processed, labelled by category and status.

| Label | Values |
|-------|--------|
| `category` | `math`, `science`, `general`, `greeting`, `error` |
| `status` | `success`, `error` |

### 2. Gauge — `brainbytes_active_sessions`
Tracks the number of chat sessions currently being processed.
Incremented when a message is received, decremented when the response is sent.

### 3. Histogram — `brainbytes_ai_response_duration_seconds`
Measures how long the AI service takes to generate a response, in seconds.
Buckets: `0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10`

### 4. Counter — `brainbytes_http_requests_total`
Tracks total HTTP requests by method, route, and status code.

### 5. Histogram — `brainbytes_http_request_duration_seconds`
Measures HTTP request duration in seconds by method, route, and status code.

---

## Recording Rules

Defined in `prometheus/recording_rules.yml`.

### `job:brainbytes_ai_response_duration_seconds:avg5m`
Precomputed average AI response time per category over 5 minutes.
```promql
rate(brainbytes_ai_response_duration_seconds_sum[5m])
/
rate(brainbytes_ai_response_duration_seconds_count[5m])
```

### `job:brainbytes_http_error_rate:5m`
Precomputed HTTP error rate (4xx/5xx) per route over 5 minutes.
```promql
sum by (route) (rate(brainbytes_http_requests_total{status_code=~"4..|5.."}[5m]))
/
sum by (route) (rate(brainbytes_http_requests_total[5m]))
```

---

## Example PromQL Queries

### AI Queries

```promql
# Total AI queries processed (all time)
brainbytes_ai_queries_total

# AI query rate per minute over last 5 minutes
rate(brainbytes_ai_queries_total[5m]) * 60

# AI query success vs error rate
rate(brainbytes_ai_queries_total{status="success"}[5m])
rate(brainbytes_ai_queries_total{status="error"}[5m])

# Breakdown of queries by category
sum by (category) (brainbytes_ai_queries_total)

# AI error rate percentage
100 * rate(brainbytes_ai_queries_total{status="error"}[5m])
    / rate(brainbytes_ai_queries_total[5m])
```

### AI Response Time

```promql
# Average AI response time over last 5 minutes (uses recording rule)
job:brainbytes_ai_response_duration_seconds:avg5m

# 50th percentile (median) AI response time
histogram_quantile(0.50, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))

# 95th percentile AI response time
histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))

# 99th percentile AI response time
histogram_quantile(0.99, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))

# Average AI response time by category
histogram_quantile(0.50,
  sum by (le, category) (
    rate(brainbytes_ai_response_duration_seconds_bucket[5m])
  )
)
```

### Active Sessions

```promql
# Current number of active sessions
brainbytes_active_sessions

# Active sessions over time (graph)
brainbytes_active_sessions
```

### HTTP Requests

```promql
# Total HTTP request rate per second
rate(brainbytes_http_requests_total[5m])

# HTTP error rate per route (uses recording rule)
job:brainbytes_http_error_rate:5m

# HTTP requests breakdown by status code
sum by (status_code) (rate(brainbytes_http_requests_total[5m]))

# 95th percentile HTTP request duration
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))

# Slowest routes by average response time
sort_desc(
  sum by (route) (rate(brainbytes_http_request_duration_seconds_sum[5m]))
  /
  sum by (route) (rate(brainbytes_http_request_duration_seconds_count[5m]))
)
```

### System Health

```promql
# Backend service up/down
up{job="brainbytes-backend"}

# All services up/down
up

# CPU usage percentage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)

# Available memory percentage
(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

---

## Accessing Prometheus

With Docker running:
- **Prometheus UI:** http://localhost:9090
- **Backend metrics:** http://localhost:4000/metrics
- **Node Exporter:** http://localhost:9100/metrics
- **cAdvisor:** http://localhost:8081/metrics

---

## Scrape Configuration

| Job | Target | Interval |
|-----|--------|----------|
| `prometheus` | `prometheus:9090` | 15s |
| `node-exporter` | `node-exporter:9100` | 15s |
| `cadvisor` | `cadvisor:8080` | 15s |
| `brainbytes-backend` | `backend:4000` | 10s |