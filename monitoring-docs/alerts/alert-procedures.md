# BrainBytes Alert Response Procedures

This document describes step-by-step response procedures for each configured alert on the **BrainBytes AI Tutoring Platform**.
Each alert includes trigger conditions, immediate actions, investigation steps, and resolution paths.

---

## How to View Active Alerts

To view the alert statuses and rule evaluation states, open the following endpoints:

* **Prometheus Alert Panel:** `http://localhost:9090/alerts`
* **Alertmanager UI:** `http://localhost:9093`
* **Check custom metrics values:** `http://localhost:9090/graph?g0.expr=PROMQL_QUERY_HERE`

---

## 1. System Health Alerts

### `ServiceDown`
* **Severity:** Critical
* **Trigger:** `up == 0` for 1 minute.
* **Immediate actions:**
  1. Check which container service is down: `docker compose ps`
  2. Check target logs: `docker compose logs <service-name>`
  3. Restart the failed container: `docker compose restart <service-name>`
* **Investigation PromQL:**
  ```promql
  up == 0
  ```
* **Resolution:** Containers are configured to restart automatically (`unless-stopped`). If a container keeps crashing, check logs for startup variables issues, DB connection issues, or node runtime exceptions.

---

### `HighCPUUsage`
* **Severity:** Warning
* **Trigger:** CPU utilization > 80% for 5 minutes.
* **Immediate actions:**
  1. Identify which process is consuming CPU: `docker stats`
  2. Check if the load is caused by backend AI classifications or MongoDB queries.
* **Investigation PromQL:**
  ```promql
  100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)
  ```
* **Resolution:** If CPU is high due to concurrent traffic load, evaluate autoscaling. If due to backend loop, restart container: `docker compose restart backend`.

---

### `HighMemoryUsage`
* **Severity:** Critical
* **Trigger:** Available host RAM is below 15% (Memory usage > 85%) for 5 minutes.
* **Immediate actions:**
  1. Check container memory states: `docker stats`
  2. Restart the container consuming the most RAM if needed.
* **Investigation PromQL:**
  ```promql
  (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
  ```
* **Resolution:** Check for memory leaks in Node.js processes. Increase host resource configurations or container memory limits in `docker-compose.yml` if necessary.

---

### `LowDiskSpace`
* **Severity:** Warning
* **Trigger:** Available disk space on root `/` is under 15% for 5 minutes.
* **Immediate actions:**
  1. Inspect host disk usage: `df -h`
  2. Run cleanup scripts.
* **Resolution:** Clean up dangling Docker images and build cache:
  ```bash
  docker system prune -a --volumes
  ```

---

### `ContainerRestarting`
* **Severity:** Warning
* **Trigger:** Container restarts > 3 times in 10 minutes.
* **Immediate actions:**
  1. Read container exit logs: `docker compose logs --tail=100 <service-name>`
* **Resolution:** Check for missing environment variables (`MONGO_URI`, `JWT_SECRET`, `HUGGINGFACE_TOKEN`) in the `.env` configuration file.

---

### `HighSystemLoad`
* **Severity:** Warning
* **Trigger:** Host 1-minute system load average > 2 for 5 minutes.
* **Immediate actions:**
  1. Check `docker stats` to identify CPU-choked containers.
* **Resolution:** Align worker counts and database transaction loads during peak school hours.

---

### `ContainerHighMemoryUsage`
* **Severity:** Warning
* **Trigger:** Container memory exceeds 85% of its configured hard limit.
* **Immediate actions:**
  1. Check which container is breaching limits: `docker stats`
* **Resolution:** Mitigate Node memory leak or temporarily adjust `mem_limit` in `docker-compose.yml`.

---

## 2. Backend & HTTP Alerts

### `HTTPErrorRateWarning` / `HTTPErrorRateCritical`
* **Severity:** Warning (>5%) / Critical (>15%)
* **Trigger:** 5xx status codes exceed the threshold for 2 minutes.
* **Immediate actions:**
  1. Identify which routes are throwing server errors:
     ```promql
     sum by (endpoint) (rate(brainbytes_http_requests_total{status=~"5.."}[5m]))
     ```
  2. Audit backend logs: `docker compose logs backend | grep -i "error"`
* **Resolution:** If MongoDB is disconnected, restore connection. If unhandled exception, roll back to the last stable git commit: `railway rollback`.

---

### `BackendMetricsDown`
* **Severity:** Critical
* **Trigger:** `up{job="brainbytes-backend"} == 0` for 1 minute.
* **Immediate actions:**
  1. Verify backend port 9080 is reachable: `curl http://localhost:9080/metrics`
* **Resolution:** Restart metrics daemon server or backend container.

---

### `DBQuerySlowWarning` / `DBQuerySlowCritical`
* **Severity:** Warning (>100ms) / Critical (>500ms) for 3 minutes.
* **Immediate actions:**
  1. Query slow operations:
     ```promql
     histogram_quantile(0.95, sum by (le, operation, collection) (rate(brainbytes_db_query_duration_seconds_bucket[5m])))
     ```
* **Resolution:** Index the slow collection fields (e.g. `sessionId`, `timestamp`) inside MongoDB.

---

### `ServerErrorSpike`
* **Severity:** Critical
* **Trigger:** Critical error rate >0.5/s for 1 minute.
* **Immediate actions:**
  1. Read backend error logs: `docker compose logs backend | grep "Critical"`
* **Resolution:** Address database query locks or upstream Hugging Face timeouts.

---

## 3. AI Tutoring Alerts

### `AIQueryErrorRateWarning` / `AIQueryErrorRateCritical`
* **Severity:** Warning (>5%) / Critical (>20%)
* **Immediate actions:**
  1. Verify if the Hugging Face Inference API is down or throwing rate limit errors.
* **Investigation PromQL:**
  ```promql
  rate(brainbytes_ai_queries_total{status="error"}[5m]) / rate(brainbytes_ai_queries_total[5m])
  ```
* **Resolution:** Wait for rate limit reset, replace the Hugging Face API token, or monitor status at status.huggingface.co.

---

### `AIResponseTimeWarning` / `AIResponseTimeCritical`
* **Severity:** Warning (>3s) / Critical (>8s)
* **Immediate actions:**
  1. Compare database latency vs AI network call latency:
     ```promql
     histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))
     ```
* **Resolution:** Cache AI response classifications, or shorten the conversation history limit (`history.limit(6)`) inside backend queries.

---

## 4. Business & UX Alerts

### `ChatExperienceDegradedWarning` / `ChatExperienceCritical`
* **Severity:** Warning (p90 > 4s) / Critical (p90 > 10s)
* **User Impact:** Students wait too long for tutor chat responses, leading to session abandonment.
* **Investigation PromQL:**
  ```promql
  histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))
  ```
* **Resolution:** Optimize DB fetch speeds and Hugging Face network call concurrency.

---

### `AIServiceDegradation`
* **Severity:** Critical
* **Trigger:** >30% of AI requests return classification errors over 10 minutes.
* **Resolution:** Verify Hugging Face Inference server availability. If degraded, switch to alternative local templates.

---

### `AuthFailureSpike`
* **Severity:** Warning
* **Trigger:** Login/Register failures exceed 1/s.
* **Resolution:** Audit request logs for security brute force attempts. Tighten backend rate-limiting middleware parameters.

---

## 5. Philippine Context Network & Data Alerts

### `NetworkInstability`
* **Severity:** Warning
* **Trigger:** Reconnect drop counts > 5/minute.
* **SOP:** Alerts engineers of high local packet loss. Ensure client-side IndexedDB cache is saving draft message state so students do not lose input answers.

---

### `SlowMobileResponses`
* **Severity:** Warning
* **Trigger:** Mobile p95 latency > 3 seconds.
* **SOP:** Ensure Next.js frontend assets are fully optimized, image sizes are minimized, and heavy layout resources are compressed.

---

### `HighDataUsage`
* **Severity:** Warning
* **Trigger:** Outbound data bandwidth > 50MB/hour.
* **SOP:** Audit express REST response schemas. Enable Brotli/Gzip compression on all API text responses and restrict returning massive unneeded JSON objects.

---

## Escalation Matrix

| Severity | SLA | Owner |
| :--- | :--- | :--- |
| **Warning** | Within 30 minutes | Operations Engineer |
| **Critical** | Within 5 minutes | Backend Lead & DevOps Engineer |
| **System Down** | Immediately | Full Team Response |
