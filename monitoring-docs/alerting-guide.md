# Alert Rules & Incident Response Guide

This document lists all active alert rules, explains their thresholds, and outlines the standard operating procedures (SOP) for resolving incident alerts on the **BrainBytes AI Tutoring Platform**.

---

## Alert Routing & Management

We use **Alertmanager** to ingest, process, and forward alerts.
1. **Grouping:** Alerts are grouped by `{alertname, job}`. If a cluster of containers restarts, instead of sending 10 individual alerts, Alertmanager waits `30s` (group_wait) to compile them and dispatches a single notification.
2. **Inhibition:** Critical alerts silence warning alerts on the same instance. For example, if `HighCPUUsage` (warning) is firing and the backend service container crashes, throwing a `ServiceDown` (critical) alert, Alertmanager inhibits the CPU warning, reducing notification noise.
3. **Routing:** All alerts are POSTed to our central webhook server (`http://backend:8082/alert`) for logging and diagnostic recording.

---

## System Alerts Matrix

### 1. HighCPUUsage (Warning)
- **Threshold:** Host CPU idle time is less than 20% (Usage > 80%) for 5 minutes.
- **Justification:** Prevents host exhaustions. Spikes of 100% are common, but sustained usage above 80% impairs overall throughput.
- **Response SOP:**
  1. Inspect cAdvisor container CPU stats to find the hot container: `sum(rate(container_cpu_usage_seconds_total[5m])) by (name)`.
  2. If the backend is looping, check active Node processes. Scale up host cores or optimize slow code execution.

### 2. HighMemoryUsage (Warning)
- **Threshold:** Host memory usage exceeds 85% for 5 minutes.
- **Justification:** Avoids host crash and disk thrashing.
- **Response SOP:**
  1. Find memory-heavy containers using `container_memory_usage_bytes`.
  2. Restart leaking containers or provision higher RAM host limits.

### 3. LowDiskSpace (Warning)
- **Threshold:** Free disk space on root `/` mount point is under 15% for 5 minutes.
- **Justification:** Prevent database blockages and logging freezes.
- **Response SOP:**
  1. Run `docker system prune -a` to clean dangling images and builder caches.
  2. Clear old Node log files and expand disk space if necessary.

---

## Application Alerts Matrix

### 1. HighErrorRate (Critical)
- **Threshold:** `5xx` response codes exceed 5% of total request throughput over 2 minutes.
- **Justification:** Suggests major application breakages (unhandled code crashes, database down).
- **Response SOP:**
  1. Check backend database logs and Mongo container status.
  2. Audit recent Git commits to see if a buggy build was deployed. Revert to the last stable SHA immediately.

### 2. SlowResponses (Warning)
- **Threshold:** 95% of HTTP response latencies exceed 2 seconds for 5 minutes.
- **Justification:** Protects user experience. Latency above 2s causes students to drop off.
- **Response SOP:**
  1. Check AI API response speeds. If Hugging Face is slow, implement local fallbacks.
  2. Optimize database query paths (ensure proper indexing on sessions/messages).

### 3. ContainerHighMemoryUsage (Warning)
- **Threshold:** A container's RAM usage exceeds 85% of its configured hard limit.
- **Justification:** Prevents container termination due to Out-Of-Memory (OOM) kills.
- **Response SOP:**
  1. Run garbage collection manually or investigate memory leaks (e.g. unclosed event listeners).
  2. Temporarily increase container `mem_limit` in `docker-compose.yml`.

---

## Business & Context Alerts Matrix

### 1. NoActiveSessions (Warning)
- **Threshold:** Active tutoring sessions gauge is exactly `0` for 30 minutes.
- **Justification:** Ensures service availability. In normal operating hours, a complete lack of sessions indicates a user-facing issue (e.g. login pages failing, DNS failures).
- **Response SOP:**
  1. Perform manual sanity checks on the login and chat UI from a mobile client.
  2. Inspect DNS settings and third-party router routing tables.

### 2. HighAIResponseTime (Warning)
- **Threshold:** Average AI hint generation latency exceeds 5 seconds over 5 minutes.
- **Justification:** Spikes indicate Hugging Face rate limits or upstream congestion.
- **Response SOP:**
  1. Check Hugging Face API dashboard status.
  2. If the API is rate-limiting, switch to our backup API key or implement queue delays.

### 3. NetworkInstability (Warning)
- **Threshold:** Outbound connection drops exceed 5 drops/minute for 5 minutes.
- **Justification:** Philippines mobile users experience high network dropouts. If drops rise, it suggests the app is failing to recover connection states properly.
- **Response SOP:**
  1. Ensure client-side retry logic is active.
  2. Check if local ISP/backhaul fiber is down in target regions.

### 4. SlowMobileResponses (Warning)
- **Threshold:** Mobile user latency (95th percentile) exceeds 3 seconds for 5 minutes.
- **Justification:** Poor mobile performance impacts students studying on data connections.
- **Response SOP:**
  1. Check if Next.js assets are bundle-optimized.
  2. Minimize image files and optimize API payloads.

### 5. HighDataUsage (Warning)
- **Threshold:** Bandwidth usage exceeds 50MB in an hour.
- **Justification:** Many Filipino students study on budget prepaid mobile data packages (e.g. 1GB/day). Unusually high data transmission drains their prepaid balances quickly.
- **Response SOP:**
  1. Audit payload sizes. Ensure Gzip/Brotli compression is active on Express responses.
  2. Avoid sending heavy metadata in chat JSON payloads.
