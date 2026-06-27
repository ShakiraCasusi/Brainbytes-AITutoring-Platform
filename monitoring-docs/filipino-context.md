# Monitoring Optimization for the Philippine Context

This document outlines how the **BrainBytes AI Tutoring Platform** adapts its monitoring thresholds and cloud resources to address the unique network, device, and economic constraints of students in the Philippines.

---

## 1. Network Instability & Intermittent Connectivity

### Challenges
Filipino students frequently experience connection drops due to weather (monsoons, typhoons), rural backhaul congestion, or intermittent mobile data cells.

### Monitoring Adaptations
- **Simulated Connection Drops Logging:** We introduced a dedicated counter `brainbytes_connection_drops_total` which is incremented whenever a client logs a reconnection retry.
- **Retry Alerting:** If drops exceed 5 per minute, the system fires a `NetworkInstability` warning. This alerts engineers that network conditions are degrading, prompting them to activate aggressive client-side caching (storing chat history locally in IndexedDB/localStorage).
- **Graceful Timeouts:** Standard HTTP scrape timeouts are tuned to prevent false-alarm alerts during brief network drops.

---

## 2. Mobile-First Device & Latency Tolerances

### Challenges
The vast majority of students access BrainBytes via budget Android smartphones over 3G/4G prepaid data connections. These devices have lower CPU capacity and experience high latency over cell networks.

### Monitoring Adaptations
- **User-Agent Latency Isolation:** We added the `user_agent` tag to all HTTP metrics. The query:
  `histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m]))`
  isolates mobile-only latencies.
- **Tuned Thresholds:** The normal response threshold is set to `2s`. However, for mobile users, the threshold is relaxed to `3s` before firing `SlowMobileResponses`. This avoids alert fatigue due to normal mobile cellular tower latency.

---

## 3. Data Consumption Auditing (Cost Optimization for Users)

### Challenges
Prepaid data packages (e.g. GoSURF, GigaVideo) are highly price-sensitive for Filipino students. Large payloads consume their allowances and block their ability to study.

### Monitoring Adaptations
- **Payload Volume Metrics:** We track payload sizes using `brainbytes_response_size_bytes_sum`.
- **Data Cap Warning:** The `HighDataUsage` alert fires if the total outbound volume exceeds 50MB per hour. This alerts developers if a new page layout or API response contains heavy uncompressed images, unoptimized JSON blocks, or un-Gzipped responses.

---

## 4. Cloud Resource & Budget Cost Optimization

To keep infrastructure costs low, we optimize resource allocations:

### Instance Downscaling & Off-Peak Hibernation
During local off-peak hours (1:00 AM to 5:00 AM PHT), user traffic is negligible. In production staging clusters:
- Containers are scaled down to 0 or minimized using cron jobs.
- Scrape intervals are dynamically adjusted from 5s to 15s during off-peak times to save Prometheus CPU cycles and disk writing IOPS.

### Hard Resource Boundaries
We apply strict memory limits inside `docker-compose.yml` to prevent runaway memory leaks from consuming cloud credit limits:
```yaml
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
```
If a container breaches 85% of this boundary, `ContainerHighMemoryUsage` fires, allowing developers to debug before the platform triggers an OOM termination.
