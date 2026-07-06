# Monitoring Data Generator

Manual commands to generate traffic and trigger each metric/alert condition. Run these against the backend directly (`http://localhost:4000`) while dashboards are open in Grafana and `http://localhost:9090/alerts` is open in another tab.

All commands assume PowerShell/curl on Windows or any POSIX shell — adjust quoting as needed for your terminal.

---

## Sessions

**Start a session** (increments `brainbytes_active_sessions`)
```bash
curl http://localhost:4000/api/session/start
```

**End a session** (decrements `brainbytes_active_sessions`)
```bash
curl http://localhost:4000/api/session/end
```

**Trigger High Active Sessions alert** — call start 21+ times without ending:
```bash
for i in {1..21}; do curl http://localhost:4000/api/session/start; done
```

**Trigger No Active Sessions alert** — simply leave the app idle for 30+ minutes with 0 active sessions (default state, no action needed).

---

## AI Queries

**Send a real chat message** (exercises `brainbytes_ai_queries_total`, `brainbytes_ai_response_duration_seconds`, `brainbytes_chat_end_to_end_duration_seconds`):
```bash
curl -X POST http://localhost:4000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"What is photosynthesis?","sessionId":"demo-1","subject":"biology"}'
```

**Simulated question endpoint:**
```bash
curl http://localhost:4000/api/question/ask
```

**Trigger AI Service Errors alert** — send malformed/empty payloads repeatedly to force error-path responses:
```bash
for i in {1..5}; do curl -X POST http://localhost:4000/api/messages -H "Content-Type: application/json" -d '{}'; done
```
(4+ requests in under 5 minutes to exceed the `> 3` threshold)

---

## HTTP Errors / Response Time

**Trigger High Error Rate / simulate 500s:**
```bash
for i in {1..20}; do curl http://localhost:4000/api/simulate-error; done
```

**Trigger Slow Responses** — no dedicated slow endpoint exists; this alert is best demonstrated under load or by temporarily adding an artificial delay to an endpoint for the demo, since 95th percentile response time needs sustained requests over 5 minutes to compute meaningfully.

---

## Connection Drops

**Trigger Network Instability alert** — call repeatedly to exceed 5/minute:
```bash
for i in {1..10}; do curl http://localhost:4000/api/simulate-drop; done
```

---

## Backend Down

**Trigger Backend Down alert:**
```bash
docker compose stop backend
```
Wait 1+ minute, check `http://localhost:9090/alerts` for `BackendDown` transitioning Pending → Firing.

**Restore:**
```bash
docker compose start backend
```

---

## System-Level Alerts (CPU / Memory / Disk / Container Memory)

These come from `node-exporter` and `cAdvisor`, not the backend app, so they can't be triggered via API calls. To demo:
- **CPU/Memory:** run a CPU or memory stress tool on the host (e.g. `stress-ng --cpu 4 --timeout 300s` on Linux, or a simple busy-loop script) for 5+ minutes.
- **Container Memory:** run a memory-intensive script inside the backend container, or temporarily lower `mem_limit` in `docker-compose.yml` to make the threshold easier to cross for demo purposes, then revert.
- **Disk Space:** not practical to safely simulate in a demo — document as "verified via expression review" rather than live-triggered, unless you have a disposable test volume.

---

## Mobile Response Time / High Data Usage

**Slow Mobile Responses** — requires requests with a `User-Agent` header matching `Mobile`:
```bash
curl -X POST http://localhost:4000/api/messages \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Mobile)" \
  -d '{"text":"Explain gravity","sessionId":"demo-mobile","subject":"physics"}'
```
Repeat several times over 5 minutes to build enough samples for the 95th percentile calculation.

**High Data Usage** — requires sustained large-payload responses over an hour; not practical to fully trigger in a short demo. Document via expression review, or temporarily lower the threshold (e.g. to 1 MB) for demonstration purposes and revert afterward.

---

## Quick Reference Table

| Goal | Command |
|---|---|
| Start session | `curl http://localhost:4000/api/session/start` |
| End session | `curl http://localhost:4000/api/session/end` |
| Ask question | `curl http://localhost:4000/api/question/ask` |
| Send chat message | `POST /api/messages` with `text` |
| Simulate connection drop | `curl http://localhost:4000/api/simulate-drop` |
| Simulate server error | `curl http://localhost:4000/api/simulate-error` |
| Trigger backend down | `docker compose stop backend` |