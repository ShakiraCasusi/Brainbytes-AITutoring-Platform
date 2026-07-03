# BrainBytes Alert Response Procedures

This document describes step-by-step response procedures for each configured alert.
Each alert includes trigger conditions, immediate actions, investigation steps, and resolution.

---

## How to View Active Alerts

```bash
# Prometheus UI
http://localhost:9090/alerts

# Check specific metric
http://localhost:9090/graph?g0.expr=PROMQL_QUERY_HERE
```

---

## System Alerts

### `ServiceDown`
**Severity:** Critical
**Trigger:** `up == 0` for 1 minute

**Immediate actions:**
1. Check which service is down: `docker ps`
2. Check container logs: `docker-compose logs <service-name>`
3. Restart the container: `docker-compose restart <service-name>`

**Investigation:**
```promql
# See which targets are down
up == 0
```

**Resolution:** Container restarts automatically (`restart: unless-stopped`). If it keeps crashing, check logs for startup errors and fix the underlying issue before restarting.

---

### `HighCPUUsage`
**Severity:** Warning
**Trigger:** CPU > 80% for 5 minutes

**Immediate actions:**
1. Identify which process is consuming CPU: `docker stats`
2. Check if it's the backend (AI processing spike) or MongoDB

**Investigation:**
```promql
# CPU per instance
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)

# Correlate with AI query rate
rate(brainbytes_ai_queries_total[5m])
```

**Resolution:** If caused by AI query spike, consider rate limiting `/api/messages`. If sustained, scale the backend service.

---

### `HighMemoryUsage`
**Severity:** Critical
**Trigger:** Available memory < 15% for 5 minutes

**Immediate actions:**
1. Check memory usage: `docker stats`
2. Restart the most memory-hungry container if needed

**Investigation:**
```promql
# Available memory percentage
(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Node.js heap usage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes
```

**Resolution:** Check for memory leaks in Node.js (growing heap over time). Increase container memory limits in `docker-compose.yml` if legitimately needed.

---

### `ContainerRestarting`
**Severity:** Warning
**Trigger:** Container restarted > 3 times in 10 minutes

**Immediate actions:**
1. `docker-compose logs --tail=50 <service>`
2. Look for crash reason (OOM, uncaught exception, missing env var)

**Resolution:** Fix the crash cause. Common causes: missing `MONGO_URI`, `JWT_SECRET`, or `HUGGINGFACE_TOKEN` environment variables.

---

### `HighSystemLoad`
**Severity:** Warning
**Trigger:** `node_load1 > 2` for 5 minutes

**Immediate actions:**
1. `docker stats` to identify which container is causing load
2. Check if a long-running AI query is blocking the event loop

**Resolution:** Usually resolves after the spike. If sustained, investigate AI service response times.

---

## Backend Alerts

### `AIQueryErrorRateWarning` / `AIQueryErrorRateCritical`
**Severity:** Warning (>5%) / Critical (>20%)
**Trigger:** AI error rate threshold exceeded for 2 minutes

**Immediate actions:**
1. Check which category is failing most:
```promql
sum by (category) (rate(brainbytes_ai_queries_total{status="error"}[5m]))
```
2. Check AI service logs: `docker-compose logs backend | grep "AI"`
3. Verify `HUGGINGFACE_TOKEN` is valid and not rate-limited

**Investigation:**
```promql
# Error rate by category
rate(brainbytes_ai_queries_total{status="error"}[5m])
/ rate(brainbytes_ai_queries_total[5m])

# AI timeout rate specifically
rate(brainbytes_ai_errors_total{error_type="timeout"}[5m])
```

**Resolution:**
- If HuggingFace API is rate-limited: wait for rate limit reset or upgrade plan
- If timeout: increase timeout threshold in `chatController.js` (currently 10s)
- If service_error: check `aiService.js` for connection issues

---

### `AIResponseTimeWarning` / `AIResponseTimeCritical`
**Severity:** Warning (p95 > 3s) / Critical (p95 > 8s)
**Trigger:** 95th percentile AI response time exceeded for 2 minutes

**Immediate actions:**
1. Check current AI response times:
```promql
histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))
```
2. Check if HuggingFace API is slow (external dependency)
3. Check if MongoDB history queries are slow (they run before AI call)

**Investigation:**
```promql
# Compare AI time vs DB query time
histogram_quantile(0.95, rate(brainbytes_db_query_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))
```

**Resolution:**
- Reduce `history.limit(6)` in `chatController.js` to reduce DB overhead
- Consider caching frequent AI responses
- If HuggingFace is slow, this is an external issue — monitor and wait

---

### `HTTPErrorRateWarning` / `HTTPErrorRateCritical`
**Severity:** Warning (>5%) / Critical (>15%)
**Trigger:** HTTP error rate threshold exceeded for 2 minutes

**Immediate actions:**
1. Identify which endpoints are failing:
```promql
sum by (endpoint) (rate(brainbytes_http_requests_total{status=~"4..|5.."}[5m]))
```
2. Check if it's client errors (4xx — bad requests) or server errors (5xx — bugs)

**Investigation:**
```promql
# Error breakdown by type
sum by (error_type, source) (rate(brainbytes_errors_total[5m]))

# Validation errors specifically
rate(brainbytes_validation_errors_total[5m])
```

**Resolution:**
- 4xx spike: usually frontend sending bad requests — check frontend for bugs
- 5xx spike: check backend logs for uncaught exceptions
- `docker-compose logs backend | grep "Error"`

---

### `DBQuerySlowWarning` / `DBQuerySlowCritical`
**Severity:** Warning (p95 > 100ms) / Critical (p95 > 500ms)
**Trigger:** DB query p95 exceeded for 3 minutes

**Immediate actions:**
1. Check which queries are slow:
```promql
histogram_quantile(0.95,
  sum by (le, operation, collection) (
    rate(brainbytes_db_query_duration_seconds_bucket[5m])
  )
)
```
2. Check MongoDB container health: `docker stats brainbytes-mongo`

**Resolution:**
- Ensure indexes exist on `sessionId` and `timestamp` fields (already defined in `Message.js`)
- If MongoDB container is under memory pressure, increase its memory limit
- Check if backup script is running during peak hours

---

### `BackendMetricsDown`
**Severity:** Critical
**Trigger:** `up{job="brainbytes-backend"} == 0` for 1 minute

**Immediate actions:**
1. Check if backend is running: `docker ps | grep backend`
2. Test metrics endpoint: `curl http://localhost:4000/metrics`
3. Check backend logs: `docker-compose logs backend`

**Resolution:** Backend container is down or `/metrics` route is broken. Restart backend: `docker-compose restart backend`

---

### `ServerErrorSpike`
**Severity:** Critical
**Trigger:** Critical errors > 0.5/s for 1 minute

**Immediate actions:**
1. `docker-compose logs backend --tail=100`
2. Look for unhandled exceptions or repeated error patterns

**Investigation:**
```promql
sum by (source) (rate(brainbytes_errors_total{severity="critical"}[5m]))
```

**Resolution:** Find and fix the root cause. Deploy a hotfix if needed.

---

## Business-Level Alerts

### `ChatExperienceDegradedWarning` / `ChatExperienceCritical`
**Severity:** Warning (p90 > 4s) / Critical (p90 > 10s)
**Trigger:** End-to-end chat duration p90 exceeded

**Immediate actions:**
1. Check end-to-end duration breakdown:
```promql
# Full chat duration
histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))

# Just the AI part
histogram_quantile(0.90, rate(brainbytes_ai_response_duration_seconds_bucket[5m]))

# Just DB saves
histogram_quantile(0.90, rate(brainbytes_db_query_duration_seconds_bucket[5m]))
```
2. The slowest component is the bottleneck — address it first

**User impact:** Students are waiting too long for AI tutor responses. Prioritize fixing this.

---

### `AIServiceDegradation`
**Severity:** Critical
**Trigger:** >30% of AI responses returning error category for 5 minutes

**Immediate actions:**
1. Check `HUGGINGFACE_TOKEN` is still valid
2. Test AI service directly: `curl http://localhost:4000/api/messages -d '{"text":"hello"}'`
3. Check `aiService.js` logs for error details

**Investigation:**
```promql
sum(rate(brainbytes_ai_queries_total{category="error"}[10m]))
/ sum(rate(brainbytes_ai_queries_total[10m]))
```

**Resolution:** If HuggingFace is down, the AI service falls back to error responses. Monitor status at status.huggingface.co. Consider implementing a local fallback response.

---

### `AITimeoutRateHigh`
**Severity:** Warning
**Trigger:** AI timeouts > 0.1/s for 2 minutes

**Immediate actions:**
1. Check network connectivity to HuggingFace API from the backend container:
```bash
docker exec brainbytes-backend curl -I https://api-inference.huggingface.co
```
2. Check if the 10-second timeout in `chatController.js` is too aggressive

**Resolution:** Increase timeout if HuggingFace is consistently taking 10-12s, or add retry logic.

---

### `AuthFailureSpike`
**Severity:** Warning
**Trigger:** Auth failures > 1/s for 2 minutes

**Immediate actions:**
1. Check which IPs are failing:
```promql
rate(brainbytes_auth_operations_total{status="failure"}[5m])
```
2. Check backend logs for repeated failed login attempts
3. Consider whether rate limiting on `/api/auth/login` needs tightening (currently 300 req/15min globally)

**Resolution:** If brute force attack, tighten rate limits on auth routes specifically. If a bug, check frontend login form.

---

### `NoMessagesStored`
**Severity:** Warning
**Trigger:** No messages stored for 10 minutes

**Immediate actions:**
1. Check if MongoDB is connected: `http://localhost:4000/api/health`
2. Test sending a message: `curl -X POST http://localhost:4000/api/messages -d '{"text":"test"}'`
3. Check for DB connection errors in logs

**Investigation:**
```promql
rate(brainbytes_messages_stored_total[10m])
```

**Resolution:** Usually a DB connectivity issue. Restart MongoDB: `docker-compose restart mongo`

---

## Escalation Path

| Severity | Response Time | Who |
|----------|--------------|-----|
| Warning | Within 30 minutes | Backend developer on duty |
| Critical | Within 5 minutes | Backend developer + team lead |
| Business Critical (chat experience) | Immediately | Full team |

---

## Useful PromQL Quick Reference

```promql
# Is everything up?
up

# Current error rate
sum(rate(brainbytes_errors_total[5m])) by (severity)

# AI health
rate(brainbytes_ai_queries_total{status="success"}[5m])
/ rate(brainbytes_ai_queries_total[5m])

# User experience
histogram_quantile(0.90, rate(brainbytes_chat_end_to_end_duration_seconds_bucket[5m]))

# DB health
histogram_quantile(0.95, rate(brainbytes_db_query_duration_seconds_bucket[5m]))

# Auth security
rate(brainbytes_auth_operations_total{status="failure"}[5m])
```