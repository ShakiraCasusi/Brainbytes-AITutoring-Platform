# BrainBytes Monitoring Documentation

## Overview

BrainBytes uses a monitoring stack consisting of:

- Prometheus
- Grafana
- Alertmanager
- Node Exporter
- cAdvisor
- Custom Express Metrics

---

## Architecture

Backend
↓
Prometheus
↓
Grafana
↓
Alertmanager
↓
Webhook
↓
Alert Controller
↓
MongoDB

---

## Dashboards

### System Dashboard

Displays:

- CPU Usage
- Memory Usage
- Disk Usage
- Container Statistics

### Application Dashboard

Displays:

- HTTP Requests
- Response Time
- AI Queries
- AI Errors

### Business Dashboard

Displays:

- Active Sessions
- AI Usage
- User Activity
- Connection Drops

---

## Alerting

Alertmanager sends webhook notifications to

POST /alert

The alert controller stores alerts inside MongoDB.

---

## Technologies

- Prometheus
- Grafana
- Alertmanager
- Node Exporter
- cAdvisor
- Docker