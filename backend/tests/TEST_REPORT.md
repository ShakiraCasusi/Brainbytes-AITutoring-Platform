# Backend Test Report — Week 4

## Overview

API and database persistence tests for the BrainBytes backend.

**Date:** 2026-05-21
**Tester:** Jerico Crisostomo - Backend Developer
**Co-Tester:** Shakira Casusi - Team Lead
**Environment:** Docker (local)

---

## API Tests (`npm test`)

| Test | Description                                    | Result   |
| ---- | ---------------------------------------------- | -------- |
| 1    | Health check — server and DB connected         | ✓ PASSED |
| 2    | Send chat message — user and AI messages saved | ✓ PASSED |
| 3    | Send message without body returns 400          | ✓ PASSED |
| 4    | Get chat history — messages returned in order  | ✓ PASSED |
| 5    | Chat history with limit query param            | ✓ PASSED |
| 6    | Unknown session returns empty array            | ✓ PASSED |
| 7    | Auth register endpoint exists                  | ✓ PASSED |
| 8    | Auth login with bad credentials returns 401    | ✓ PASSED |
| 9    | Users endpoint requires auth token             | ✓ PASSED |
| 10   | Materials endpoint requires auth token         | ✓ PASSED |
| 11   | Settings endpoint requires auth token          | ✓ PASSED |
| 12   | Activity endpoint requires auth token          | ✓ PASSED |

**Result: 12/12 passed**

---

## DB Persistence Tests (`node tests/db-persistence.test.js`)

| Test | Description                                         | Result   |
| ---- | --------------------------------------------------- | -------- |
| 1    | Save message to database                            | ✓ PASSED |
| 2    | Message retrievable before restart                  | ✓ PASSED |
| 3    | Backend health recovers after MongoDB restart       | ✓ PASSED |
| 4    | Previously saved message still exists after restart | ✓ PASSED |
| 5    | Message count consistent before and after restart   | ✓ PASSED |

**Result: 5/5 passed**

---

## Key Fixes Made This Week

### 1. Auth middleware not applied to protected routes

- **Problem:** `/api/users`, `/api/materials`, `/api/settings`, and `/api/activity` were accessible without a token, returning 200 instead of 401.
- **Fix:** Added `requireAuth` middleware from `middleware/auth.js` to all four routes in `server.js`.

---

## How to Run Tests

### Phase A: Running In-Memory Unit Tests (100% Offline / No Docker Required)

These verify basic application logic and React render states instantly:

1. **Run Backend Unit Tests:**
   ```bash
   cd tests
   npm install
   npx jest message.test.js aiService.test.js
   ```
2. **Run Frontend Component Tests:**
   ```bash
   cd frontend
   npm install
   npm run test
   ```

### Phase B: Running Composition & Automation Scripts (Requires Docker)

These verify connection status, network ports, databases, E2E browser flows, and container security:

1. **Verify Services Composition Uptime:**
   ```bash
   bash scripts/test-composition.sh
   ```
2. **Execute Full Automated Test & Hadolint & Security Pipeline:**
   ```bash
   bash scripts/run-all-tests.sh
   ```

---

## Complete Multi-Container QA Compliance

| Scope                     | Objective                    |   Status   | Implementation Target File                                               |
| :------------------------ | :--------------------------- | :--------: | :----------------------------------------------------------------------- |
| **Dockerfile Testing**    | Build test & lint            | **✔ Done** | [run-all-tests.sh](scripts/run-all-tests.sh) / `Dockerfile`              |
| **Container Composition** | Startup & composition checks | **✔ Done** | [test-composition.sh](scripts/test-composition.sh)                       |
| **Unit Testing**          | Message model instantiation  | **✔ Done** | [message.test.js](tests/message.test.js)                                 |
| **Unit Testing**          | AI response processing       | **✔ Done** | [aiService.test.js](tests/aiService.test.js)                             |
| **Unit Testing**          | Frontend components          | **✔ Done** | [MessageList.test.js](frontend/__tests__/MessageList.test.js)            |
| **Integration Testing**   | HTTP API routes              | **✔ Done** | [api.test.js](tests/api.test.js)                                         |
| **Integration Testing**   | Database interactions        | **✔ Done** | [chatIntegration.test.js](tests/chatIntegration.test.js)                 |
| **Database Persistence**  | Uptime across restarts       | **✔ Done** | [db-persistence.test.js](tests/db-persistence.test.js)                   |
| **Container Networks**    | Cross-service calls          | **✔ Done** | [container-communication.test.js](tests/container-communication.test.js) |
| **End-to-End (E2E)**      | Full browser workflow        | **✔ Done** | [e2e.test.js](tests/e2e.test.js)                                         |
| **Resource Usage**        | Stats and strict latencies   | **✔ Done** | [resource-usage.test.js](tests/resource-usage.test.js)                   |
| **Security Testing**      | Trivy vulnerability scan     | **✔ Done** | [run-all-tests.sh](scripts/run-all-tests.sh)                             |
