# Backend Test Report — Week 4

## Overview
API and database persistence tests for the BrainBytes backend.

**Date:** 2026-05-21
**Tester:** Jerico Crisostomo - Backend Developer
**Environment:** Docker (local)

---

## API Tests (`npm test`)

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

---

## DB Persistence Tests (`node tests/db-persistence.test.js`)

| Test | Description | Result |
|------|-------------|--------|
| 1 | Save message to database | ✓ PASSED |
| 2 | Message retrievable before restart | ✓ PASSED |
| 3 | Backend health recovers after MongoDB restart | ✓ PASSED |
| 4 | Previously saved message still exists after restart | ✓ PASSED |
| 5 | Message count consistent before and after restart | ✓ PASSED |

**Result: 5/5 passed**

---

## Key Fixes Made This Week

### 1. Auth middleware not applied to protected routes
- **Problem:** `/api/users`, `/api/materials`, `/api/settings`, and `/api/activity` were accessible without a token, returning 200 instead of 401.
- **Fix:** Added `requireAuth` middleware from `middleware/auth.js` to all four routes in `server.js`.

---

## How to Run Tests

```bash
# Start containers
docker-compose up -d

# API tests
cd backend && npm test

# DB persistence tests (use your actual mongo container name)
$env:MONGO_CONTAINER="brainbytes-aitutoring-platform-mongo-1"; $env:API_URL="http://localhost:4000/api"; node tests/db-persistence.test.js
```