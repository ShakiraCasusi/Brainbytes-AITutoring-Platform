# Alert Rules

All alert rules are defined in `monitoring/alert_rules.yml` and evaluated by Prometheus every 15s (per `global.evaluation_interval` in `prometheus.yml`). Rules are grouped under `BrainBytes Alerts`.

---

## System Alerts

### High CPU Usage
- **Expression:** `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80`
- **For:** 5 minutes
- **Severity:** warning
- **Source:** node-exporter
- **Description:** CPU usage has stayed above 80% for 5 minutes on the affected instance.

### High Memory Usage
- **Expression:** `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85`
- **For:** 5 minutes
- **Severity:** warning
- **Source:** node-exporter

### Low Disk Space
- **Expression:** `(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15`
- **For:** 5 minutes
- **Severity:** warning
- **Source:** node-exporter

---

## Application Alerts

### Backend Down
- **Expression:** `up{job="brainbytes-backend"} == 0`
- **For:** 1 minute
- **Severity:** critical
- **Description:** Prometheus has failed to scrape the backend's `/metrics` endpoint (port 9080) for over a minute — indicates the backend container is down or unreachable.

### High Error Rate
- **Expression:** `(sum(rate(brainbytes_http_requests_total{status=~"5.."}[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100 > 5`
- **For:** 2 minutes
- **Severity:** critical
- **Description:** More than 5% of HTTP responses in the last 5 minutes were 5xx server errors.

### Slow Responses
- **Expression:** `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket[5m])) by (le)) > 2`
- **For:** 5 minutes
- **Severity:** warning
- **Description:** 95th percentile HTTP response time exceeded 2 seconds.

### Container High Memory Usage
- **Expression:** `(container_memory_usage_bytes{name=~"brainbytes-.*"} / container_spec_memory_limit_bytes{name=~"brainbytes-.*"}) * 100 > 85`
- **For:** 5 minutes
- **Severity:** warning
- **Source:** cAdvisor

---

## AI Alerts

### High AI Response Time
- **Expression:** `histogram_quantile(0.95, sum(rate(brainbytes_ai_response_duration_seconds_bucket[5m])) by (le)) > 5`
- **For:** 5 minutes
- **Severity:** warning
- **Description:** 95th percentile AI response time exceeded 5 seconds.

### AI Service Errors
- **Expression:** `increase(brainbytes_ai_queries_total{status="error"}[5m]) > 3`
- **For:** 2 minutes
- **Severity:** warning
- **Description:** More than 3 AI queries resulted in an error status within 5 minutes.

---

## Business Alerts

### No Active Sessions
- **Expression:** `brainbytes_active_sessions == 0`
- **For:** 30 minutes
- **Severity:** warning
- **Description:** No active tutoring sessions for 30 minutes — flags prolonged inactivity.

### High Active Sessions
- **Expression:** `brainbytes_active_sessions > 20`
- **For:** 5 minutes
- **Severity:** warning
- **Description:** More than 20 concurrent tutoring sessions — capacity/load signal.

---

## Network Alerts

### Network Instability
- **Expression:** `rate(brainbytes_connection_drops_total[5m]) > 5`
- **For:** 5 minutes
- **Severity:** warning
- **Description:** Connection drop rate exceeds 5 per minute.

### Slow Mobile Responses
- **Expression:** `histogram_quantile(0.95, sum(rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m])) by (le)) > 3`
- **For:** 5 minutes
- **Severity:** warning
- **Description:** 95th percentile response time for mobile clients exceeded 3 seconds.

### High Data Usage
- **Expression:** `sum(rate(brainbytes_response_size_bytes_sum[1h])) > 52428800`
- **For:** 15 minutes
- **Severity:** warning
- **Description:** Application response payloads exceed 50 MB/hour in aggregate.

---

## Recording Rules

Defined separately in `monitoring/recording_rules.yml`, evaluated every 30s. These precompute values reused by dashboards and alert expressions above, so panels/alerts don't need to recompute the same rate() query repeatedly.

| Recording Rule | Expression |
|---|---|
| `job:brainbytes_ai_response_duration_seconds:avg5m` | Average AI response time over 5m |
| `job:brainbytes_http_error_rate:5m` | HTTP error ratio (4xx/5xx ÷ total) per endpoint over 5m |