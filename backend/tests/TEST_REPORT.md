# Backend Testing & Monitoring Documentation

## Overview

API, database persistence, expanded unit tests, and Prometheus metrics for the BrainBytes backend.

**Last Updated:** 2026-06-27
**Author:** Jerico Crisostomo — Backend Developer
**Co-Tester:** Shakira Casusi — Team Lead
**Environment:** Docker (local)

---

## Week 4 — API & DB Persistence Tests

### API Tests (`npm test`)

| Test | Description | Result |
|------|-------------|--------|
| 1 | Health check — server and DB connected | ✓ PASSED |
| 2 | Send chat message — user and AI messages saved | ✓ PASSED |
| 3 | Send message without body returns 400 | ✓ PASSED |
| 4 | Get chat history — messages returned in order | ✓ PASSED |
| 5 | Chat history with limit query param | ✓ PASSED |
| 6 | Unknown session returns empty array | ✓ PASSED |
| 7 | Auth register endpoint exists | ✓ PASSED |
| 8 | Auth login with bad credentials returns 401 | ✓ PASSED |
| 9 | Users endpoint requires auth token | ✓ PASSED |
| 10 | Materials endpoint requires auth token | ✓ PASSED |
| 11 | Settings endpoint requires auth token | ✓ PASSED |
| 12 | Activity endpoint requires auth token | ✓ PASSED |

**Result: 12/12 passed**

### DB Persistence Tests (`node tests/db-persistence.test.js`)

| Test | Description | Result |
|------|-------------|--------|
| 1 | Save message to database | ✓ PASSED |
| 2 | Message retrievable before restart | ✓ PASSED |
| 3 | Backend health recovers after MongoDB restart | ✓ PASSED |
| 4 | Previously saved message still exists after restart | ✓ PASSED |
| 5 | Message count consistent before and after restart | ✓ PASSED |

**Result: 5/5 passed**

### Key Fixes — Week 4

**Auth middleware not applied to protected routes**
- **Problem:** `/api/users`, `/api/materials`, `/api/settings`, and `/api/activity` were accessible without a token, returning 200 instead of 401.
- **Fix:** Added `requireAuth` middleware from `middleware/auth.js` to all four routes in `app.js`.

---

## Week 5 — Expanded Test Coverage (Jest + Supertest + Mock DB)

All Jest tests run with `npm test`. No Docker required — uses `mongodb-memory-server`.

**Result: 72/72 passed**

### `tests/api.test.js` — Comprehensive API Tests

| Test | Description | Result |
|------|-------------|--------|
| 1 | Health check returns ok with database connected | ✓ PASSED |
| 2 | Registers a new user with valid data | ✓ PASSED |
| 3 | Returns 400 when name is missing | ✓ PASSED |
| 4 | Returns 400 when email is missing | ✓ PASSED |
| 5 | Returns 400 when password is missing | ✓ PASSED |
| 6 | Returns 400 when password is too short | ✓ PASSED |
| 7 | Returns 409 when email is already registered | ✓ PASSED |
| 8 | Logs in with valid credentials | ✓ PASSED |
| 9 | Returns 401 with wrong password | ✓ PASSED |
| 10 | Returns 401 with non-existent email | ✓ PASSED |
| 11 | Returns 400 when email is missing on login | ✓ PASSED |
| 12 | Returns 400 when password is missing on login | ✓ PASSED |
| 13 | Returns current user with valid token | ✓ PASSED |
| 14 | Returns 401 without token on /me | ✓ PASSED |
| 15 | Returns 401 with invalid token | ✓ PASSED |
| 16 | Sends a message and returns user and AI response | ✓ PASSED |
| 17 | Generates a sessionId when not provided | ✓ PASSED |
| 18 | Returns 400 when message is missing | ✓ PASSED |
| 19 | Returns 400 when body is empty | ✓ PASSED |
| 20 | Handles subject field correctly | ✓ PASSED |
| 21 | Returns messages in chronological order | ✓ PASSED |
| 22 | Respects limit query param | ✓ PASSED |
| 23 | Respects page query param | ✓ PASSED |
| 24 | Returns empty array for unknown session | ✓ PASSED |
| 25 | Filters by subject query param | ✓ PASSED |
| 26 | Creates a new chat session | ✓ PASSED |
| 27 | Creates session with anonymous user when userId not provided | ✓ PASSED |
| 28 | GET /api/users returns 401 without token | ✓ PASSED |
| 29 | GET /api/materials returns 401 without token | ✓ PASSED |
| 30 | GET /api/settings returns 401 without token | ✓ PASSED |
| 31 | GET /api/activity returns 401 without token | ✓ PASSED |

### `tests/db.test.js` — Database Model Tests

| Test | Description | Result |
|------|-------------|--------|
| 1 | Saves a valid user message | ✓ PASSED |
| 2 | Saves a valid AI message | ✓ PASSED |
| 3 | Fails validation when text is missing | ✓ PASSED |
| 4 | Fails validation when sender is invalid | ✓ PASSED |
| 5 | Fails validation when sessionId is missing | ✓ PASSED |
| 6 | Fails validation when text exceeds 1000 characters | ✓ PASSED |
| 7 | Retrieves messages in chronological order | ✓ PASSED |
| 8 | Returns empty array for unknown sessionId | ✓ PASSED |
| 9 | Saves optional subject field | ✓ PASSED |
| 10 | Counts messages by sessionId | ✓ PASSED |
| 11 | Saves a valid user | ✓ PASSED |
| 12 | Lowercases email on save | ✓ PASSED |
| 13 | Fails validation when name is missing | ✓ PASSED |
| 14 | Fails validation when email is missing | ✓ PASSED |
| 15 | Enforces unique email constraint | ✓ PASSED |
| 16 | Saves preferredSubjects array | ✓ PASSED |
| 17 | Finds user by email | ✓ PASSED |
| 18 | Saves a valid activity | ✓ PASSED |
| 19 | Fails validation when type is invalid | ✓ PASSED |
| 20 | Fails validation when summary is missing | ✓ PASSED |
| 21 | Retrieves activities by sessionId | ✓ PASSED |

### `tests/errorHandler.test.js` — Error Handling Tests

| Test | Description | Result |
|------|-------------|--------|
| 1 | Returns 401 when Authorization header is missing | ✓ PASSED |
| 2 | Returns 401 when token is malformed | ✓ PASSED |
| 3 | Returns 401 when Bearer prefix is missing | ✓ PASSED |
| 4 | Returns 401 when token is expired | ✓ PASSED |
| 5 | Returns 400 when message is empty string | ✓ PASSED |
| 6 | Returns 400 when message field is null | ✓ PASSED |
| 7 | Handles very long messages (>1000 chars) | ✓ PASSED |
| 8 | Returns 400 when saving message without text | ✓ PASSED |
| 9 | Returns 400 when saving message without sessionId | ✓ PASSED |
| 10 | Returns 400 when register body is empty | ✓ PASSED |
| 11 | Returns 400 when login body is empty | ✓ PASSED |
| 12 | Does not expose password hash in register response | ✓ PASSED |
| 13 | Does not expose password hash in login response | ✓ PASSED |
| 14 | Returns 404 for unknown GET route | ✓ PASSED |
| 15 | Returns 404 for unknown POST route | ✓ PASSED |

### Key Fixes — Week 5

**`app.js` updates**
- Added `aiService.initializeAI()` call on startup
- Added 404 handler as last middleware
- Added `requireAuth` to all protected routes

**`jest.config.js` fix**
- Fixed `_tests_` typo → `tests` (single vs double underscore caused Jest to find no test files)
- Added `testTimeout: 30000` for `mongodb-memory-server` download on first run
- Excluded `chat.test.js` and `db-persistence.test.js` from Jest (they are manual tests)

**Bug found: `chatController.sendMessage` returns 500 for oversized messages**
- **Problem:** Messages exceeding 1000 characters trigger a Mongoose `ValidationError` inside the catch block, returning 500 instead of 400.
- **Fix applied:** Added `ValidationError` check in the catch block to return 400.

---

## Week 8 — Prometheus Metrics & CI Fix

### Custom Metrics (`backend/middleware/metrics.js`)

Metrics are exposed at `http://localhost:4000/metrics` and scraped by Prometheus every 10 seconds.

| Metric | Type | Description |
|--------|------|-------------|
| `brainbytes_ai_queries_total` | Counter | Total AI queries processed, labelled by category and status |
| `brainbytes_active_sessions` | Gauge | Number of chat sessions currently being processed |
| `brainbytes_ai_response_duration_seconds` | Histogram | AI response time in seconds, bucketed for percentile analysis |
| `brainbytes_http_requests_total` | Counter | Total HTTP requests by method, route, and status code |
| `brainbytes_http_request_duration_seconds` | Histogram | HTTP request duration in seconds |

**Verified output after sending a message:**
```
brainbytes_ai_queries_total{category="math",status="success"} 1
brainbytes_active_sessions 0
brainbytes_ai_response_duration_seconds_count{category="math"} 1
brainbytes_http_requests_total{method="POST",route="/api/messages",status_code="201"} 1
```

### Recording Rules (`prometheus/recording_rules.yml`)

| Rule | Expression | Purpose |
|------|------------|---------|
| `job:brainbytes_ai_response_duration_seconds:avg5m` | `rate(sum) / rate(count)` | Precomputed average AI response time per category |
| `job:brainbytes_http_error_rate:5m` | `rate(4xx+5xx) / rate(total)` | Precomputed HTTP error rate per route |

### New Alert Rules (`prometheus/alert_rules.yml`)

| Alert | Condition | Severity |
|-------|-----------|----------|
| `HighAIQueryErrorRate` | >10% AI queries failing | warning |
| `SlowAIResponse` | p95 response time >5s | warning |
| `HighHTTPErrorRate` | >5% HTTP errors | warning |
| `BackendMetricsDown` | `/metrics` endpoint unreachable | critical |

### CI Fix (`.github/workflows/ci.yml`)

- **Removed** unreliable `sleep 5` after server start
- **Replaced** with a 60-attempt polling loop that checks `/api/health` every second
- **Separated** unit tests (Jest + mock DB, no Docker needed) from integration tests (live server)

### Key Fixes — Week 8

**`prometheus/prometheus.yml`**
- Added `brainbytes-backend` scrape job targeting `backend:4000/metrics` at 10s interval
- Added relabeling to node-exporter and cadvisor jobs
- Added `recording_rules.yml` to rule files

**`prometheus/recording_rules.yml`** (new)
- 2 recording rules for faster dashboard queries

**`prometheus/alert_rules.yml`**
- Added 4 backend-specific alert rules on top of existing system alerts

---

## npm Scripts

```bash
npm test                  # Run all Jest tests (api, db, errorHandler) — no Docker needed
npm run test:watch        # Run Jest in watch mode
npm run test:coverage     # Run Jest with coverage report
npm run test:db           # Run DB persistence test (requires Docker)
node tests/chat.test.js   # Run manual API integration test (requires Docker)
```

---

## How to Run Tests

### Phase A: Unit Tests (No Docker Required)

```bash
cd backend
npm test
```

### Phase B: Integration & Persistence Tests (Requires Docker)

```bash
# Start containers
docker-compose up -d

# Manual API test
API_URL=http://localhost:4000/api node tests/chat.test.js

# DB persistence test
$env:MONGO_CONTAINER="brainbytes-aitutoring-platform-mongo-1"
$env:API_URL="http://localhost:4000/api"
node tests/db-persistence.test.js
```

### Phase C: Verify Prometheus Metrics

```bash
# Check metrics endpoint
curl http://localhost:4000/metrics

# Send a message to generate metrics
curl -UseBasicParsing -Method POST http://localhost:4000/api/messages `
  -ContentType "application/json" `
  -Body '{"text": "help me with math", "sessionId": "test-1"}'

# Open Prometheus UI in browser
# http://localhost:9090/targets  — verify brainbytes-backend is UP
# http://localhost:9090          — run PromQL queries
```

---

## Complete Multi-Container QA Compliance

| Scope | Objective | Status | Implementation Target File |
|:------|:----------|:------:|:--------------------------|
| **Dockerfile Testing** | Build test & lint | ✔ Done | `Dockerfile` |
| **Container Composition** | Startup & composition checks | ✔ Done | `docker-compose.yml` |
| **Unit Testing** | Message model instantiation | ✔ Done | `tests/db.test.js` |
| **Unit Testing** | AI response processing | ✔ Done | `__tests__/messageService.test.js` |
| **Unit Testing** | Frontend components | ✔ Done | `frontend/__tests__/` |
| **Integration Testing** | HTTP API routes | ✔ Done | `tests/api.test.js` |
| **Integration Testing** | Error handling middleware | ✔ Done | `tests/errorHandler.test.js` |
| **Database Persistence** | Uptime across restarts | ✔ Done | `tests/db-persistence.test.js` |
| **Metrics** | Prometheus custom metrics | ✔ Done | `middleware/metrics.js` |
| **Monitoring** | Recording rules | ✔ Done | `prometheus/recording_rules.yml` |
| **Alerting** | Backend alert rules | ✔ Done | `prometheus/alert_rules.yml` |
| **CI/CD** | Reliable server startup check | ✔ Done | `.github/workflows/ci.yml` |
