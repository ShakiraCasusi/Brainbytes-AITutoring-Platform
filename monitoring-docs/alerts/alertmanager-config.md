# Alertmanager Configuration

Configuration file: `monitoring/alertmanager.yml`

## Global Settings

- **Resolve timeout:** 5 minutes — how long Alertmanager waits after an alert stops firing before marking it resolved.

## Routing

- **Group by:** `alertname`, `job` — alerts with the same name and job are batched into a single notification instead of one message per alert.
- **Group wait:** 30 seconds — initial delay before sending the first notification for a new group, to allow related alerts to batch together.
- **Group interval:** 5 minutes — minimum time before sending a notification about new alerts added to an existing group.
- **Repeat interval:** 4 hours — how often a still-firing alert is re-sent if not resolved.
- **Default receiver:** `web-hook`

## Receivers

### web-hook
- **Type:** Webhook
- **URL:** `http://backend:8082/alert`
- **Send resolved:** enabled — Alertmanager also notifies the webhook when an alert stops firing, not just when it starts.

This webhook is received by a dedicated Express endpoint (`alert-receiver.js`) running inside the backend container on port 8082, separate from the main API (port 4000) and metrics server (port 9080).

**Current behavior:** the receiver logs the full alert payload to stdout (`console.log`) and returns `200 OK`. It does **not** currently persist alerts to MongoDB or any other store — alert history is only visible via `docker compose logs backend`.

> If persistent alert history is needed later, `alert-receiver.js` would need a Mongoose model (e.g. `AlertHistory`) and a `.create()` call inside the `/alert` handler.

## Inhibition Rules

```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

If a `critical` alert is firing for a given `alertname`/`instance` pair, Alertmanager suppresses a matching `warning`-severity alert for the same `alertname`/`instance` — avoids duplicate noise when a critical issue (e.g. `BackendDown`) would also trigger related warning-level alerts.

## Verifying the Pipeline

1. Prometheus evaluates rules → alert transitions to `firing` state → visible at `http://localhost:9090/alerts`
2. Prometheus pushes firing alerts to Alertmanager (`http://alertmanager:9093`, configured in `prometheus.yml`)
3. Alertmanager applies grouping/inhibition rules → visible at `http://localhost:9093`
4. Alertmanager sends webhook POST to `http://backend:8082/alert`
5. Alert receiver logs payload — check with `docker compose logs backend | grep "Alert received"`