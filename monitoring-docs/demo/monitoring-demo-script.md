# Monitoring Demonstration Script

This script covers the full monitoring stack end-to-end. Steps marked **[LIVE DEMO]** are the recommended subset for an in-person/recorded presentation; the rest are included here for completeness and grading/documentation purposes.

---

## Step 1 — Start the Stack

```bash
docker compose up -d
docker compose ps
```

Confirm all services show `Up` and `backend`/`mongo` show `(healthy)`.

## Step 2 — Open the Monitoring UIs

| Tool | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend health | http://localhost:4000/api/health |
| Prometheus | http://localhost:9090 |
| Prometheus Alerts | http://localhost:9090/alerts |
| Alertmanager | http://localhost:9093 |
| Grafana | http://localhost:3001 |

## Step 3 — **[LIVE DEMO]** Generate Normal Traffic

Send a few real chat messages through the frontend UI, or via curl (see `data-generator.md`):
```bash
curl -X POST http://localhost:4000/api/messages -H "Content-Type: application/json" -d '{"text":"What is photosynthesis?","sessionId":"demo","subject":"biology"}'
```

In Grafana, open the **Application Dashboard** and confirm:
- HTTP Requests counter increasing
- AI Queries counter increasing
- Response Time histogram populating

## Step 4 — Trigger Each Alert

### Application-Level (recommended for live demo)

**[LIVE DEMO] Backend Down (critical)**
```bash
docker compose stop backend
```
Wait ~60s → check `http://localhost:9090/alerts` → `BackendDown` goes Pending → Firing → check `http://localhost:9093` for the grouped alert → check `docker compose logs backend` after restart for the received webhook payload (it will only show once the backend is back up, since the receiver lives inside it — for the live demo, it's fine to just show the Prometheus/Alertmanager firing state, since the container is stopped).
```bash
docker compose start backend
```

**[LIVE DEMO] AI Service Errors (warning)**
```bash
for i in {1..5}; do curl -X POST http://localhost:4000/api/messages -H "Content-Type: application/json" -d '{}'; done
```
Watch `AIServiceErrors` transition to Firing within ~2 minutes.

**[LIVE DEMO] High Active Sessions (warning)**
```bash
for i in {1..21}; do curl http://localhost:4000/api/session/start; done
```
Watch `HighActiveSessions` fire after 5 minutes sustained. Reset with matching `/api/session/end` calls afterward.

### Additional Application/Network Alerts (documented, optional for live demo)

**High Error Rate (critical)**
```bash
for i in {1..20}; do curl http://localhost:4000/api/simulate-error; done
```

**Network Instability (warning)**
```bash
for i in {1..10}; do curl http://localhost:4000/api/simulate-drop; done
```

**Slow Responses / Slow AI Responses / Slow Mobile Responses (warning)**
These require sustained load over 5 minutes to compute a stable 95th-percentile value — not practical to trigger instantly. Document by showing the PromQL expression in Prometheus's expression browser and explaining the threshold, rather than live-triggering.

**No Active Sessions (warning)**
Naturally occurs after 30 idle minutes with no active sessions — demonstrate by pointing out the rule definition rather than waiting live.

### System-Level Alerts (documented, not practical to trigger live)

**High CPU Usage / High Memory Usage / Low Disk Space (node-exporter)**
**Container High Memory Usage (cAdvisor)**
**High Data Usage**

These depend on host resource conditions or sustained hourly data volume. For the recorded demo, show these alerts listed and Inactive in the Prometheus Alerts page, and walk through their PromQL expressions and thresholds from `alert-rules.md` instead of forcing the condition.

## Step 5 — Verify the Alert Pipeline End-to-End

For at least one alert (recommend `BackendDown`, since it's the fastest and most reliable to trigger):

1. Alert appears in Prometheus (`/alerts`, state = Firing)
2. Alert forwarded to Alertmanager (`:9093`, grouped by `alertname`/`job`)
3. Alertmanager sends webhook POST to `http://backend:8082/alert`
4. Confirm receipt:
   ```bash
   docker compose logs backend | grep "Alert received"
   ```
   Note: alerts are currently logged to stdout only, not persisted to a database — see `alertmanager-config.md` for details.

## Step 6 — Review Dashboards

Walk through each Grafana dashboard and narrate what it shows:
- **System Dashboard** — CPU, memory, disk, container stats (node-exporter + cAdvisor)
- **Application Dashboard** — HTTP requests, response time, AI queries, AI errors
- **Business Dashboard** — active sessions, AI usage, user activity, connection drops

## Step 7 — Reset State

```bash
for i in {1..21}; do curl http://localhost:4000/api/session/end; done
docker compose restart backend
```