# Monitoring Stack Setup & Simulation Guide

This document provides setup instructions and testing scenarios to verify the monitoring stack on the **BrainBytes AI Tutoring Platform**.

---

## 1. How to Boot the Stack

To build and run all services (including Prometheus, Alertmanager, Node Exporter, and cAdvisor):

```bash
# 1. Shutdown any existing containers
docker-compose down

# 2. Rebuild and launch the stack in the background
docker-compose up -d --build

# 3. Verify all containers are running
docker-compose ps
```

### Accessing Dashboards
- **Backend API Gateway:** `http://localhost:4000`
- **Prometheus UI:** `http://localhost:9090`
- **Alertmanager UI:** `http://localhost:9093`
- **cAdvisor Dashboard:** `http://localhost:8081`
- **Node Exporter Endpoint:** `http://localhost:9100/metrics`
- **Backend Metrics Endpoint:** `http://localhost:9080/metrics`

---

## 2. Configuration Files Directory

The configuration files for this setup are maintained inside the repository:
- **Docker Compose:** [docker-compose.yml](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/docker-compose.yml)
- **Prometheus Config:** [monitoring/prometheus.yml](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/monitoring/prometheus.yml)
- **Alerting Rules:** [monitoring/alert_rules.yml](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/monitoring/alert_rules.yml)
- **Recording Rules:** [monitoring/recording_rules.yml](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/monitoring/recording_rules.yml)
- **Alertmanager Config:** [monitoring/alertmanager.yml](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/monitoring/alertmanager.yml)

---

## 3. Scenario-Based Testing Framework

We use `simulate-scenarios.js` to simulate traffic. Make sure you install dependencies in the backend first:

```bash
cd backend
npm install
```

### Scenario 1: Normal Load
Simulates standard user tutoring sessions. Students log in, start a session, ask 1 to 3 questions, and log out.
- **Run command:**
  ```bash
  node simulate-scenarios.js normal-load
  ```
- **Expected Metrics Impact:**
  - `brainbytes_active_sessions` fluctuates between `0` and `1`.
  - HTTP status codes are `200` and `201`.
  - Average latencies remain low (<0.5s).

### Scenario 2: High Load (Stress Test)
Spawns 8 concurrent worker threads querying the backend and Hugging Face API as fast as possible to stress resource limits.
- **Run command:**
  ```bash
  node simulate-scenarios.js high-load
  ```
- **Expected Metrics Impact:**
  - `brainbytes_active_sessions` rises and remains high.
  - cAdvisor reports backend CPU usage spikes (`container_cpu_usage_seconds_total`).
  - Average HTTP duration and AI response times rise.

### Scenario 3: Error Spikes & Network Instability
Generates an intense flow of simulated network drops and `500 Internal Server Errors`.
- **Run command:**
  ```bash
  node simulate-scenarios.js error-spikes
  ```
- **Expected Metrics Impact:**
  - `brainbytes_connection_drops_total` increments rapidly, triggering the `NetworkInstability` alert.
  - HTTP `500` status codes surge, causing `HighErrorRate` (critical) to transition to `Firing`.
  - The alert-receiver on port `8080` logs the dispatched alert JSON payload from Alertmanager.
