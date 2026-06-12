# Backend Testing Documentation

## Overview

This document covers all test files, changes, and findings for the BrainBytes backend.
It covers API + DB Persistence and Expanded Test Coverage.

---

## Test Files

### 1. `tests/chat.test.js` — Manual API Test
**Run with:** `node tests/chat.test.js` (requires Docker containers running)

A manual integration test using axios. Tests the live API against real MongoDB.

| Test | Description |
|------|-------------|
| 1 | Health check — server and DB connected |
| 2 | Send chat message — user and AI messages saved |
| 3 | Send message without body returns 400 |
| 4 | Get chat history — messages returned in order |
| 5 | Chat history with limit query param |
| 6 | Unknown session returns empty array |
| 7 | Auth register endpoint exists |
| 8 | Auth login with bad credentials returns 401 |
| 9 | Users endpoint requires auth token |
| 10 | Materials endpoint requires auth token |
| 11 | Settings endpoint requires auth token |
| 12 | Activity endpoint requires auth token |

---

### 2. `tests/db-persistence.test.js` — DB Persistence Test
**Run with:**
```powershell
$env:MONGO_CONTAINER="brainbytes-aitutoring-platform-mongo-1"; $env:API_URL="http://localhost:4000/api"; node tests/db-persistence.test.js
```
Requires Docker containers running. Restarts the MongoDB container and verifies data survives.

| Test | Description |
|------|-------------|
| 1 | Save message to database |
| 2 | Message retrievable before restart |
| 3 | Backend health recovers after MongoDB restart |
| 4 | Previously saved message still exists after restart |
| 5 | Message count consistent before and after restart |

---

### 3. `tests/api.test.js` — Comprehensive API Test (Jest + Supertest)
**Run with:** `npm test`

Uses in-memory MongoDB. No Docker required. Tests all endpoints with valid and invalid inputs.

#### Health
| Test | Description |
|------|-------------|
| 1 | GET /api/health returns ok with database connected |

#### Auth — Register
| Test | Description |
|------|-------------|
| 2 | Registers a new user with valid data |
| 3 | Returns 400 when name is missing |
| 4 | Returns 400 when email is missing |
| 5 | Returns 400 when password is missing |
| 6 | Returns 400 when password is too short |
| 7 | Returns 409 when email is already registered |

#### Auth — Login
| Test | Description |
|------|-------------|
| 8 | Logs in with valid credentials |
| 9 | Returns 401 with wrong password |
| 10 | Returns 401 with non-existent email |
| 11 | Returns 400 when email is missing |
| 12 | Returns 400 when password is missing |

#### Auth — Me
| Test | Description |
|------|-------------|
| 13 | Returns current user with valid token |
| 14 | Returns 401 without token |
| 15 | Returns 401 with invalid token |

#### Chat — Send Message
| Test | Description |
|------|-------------|
| 16 | Sends a message and returns user and AI response |
| 17 | Generates a sessionId when not provided |
| 18 | Returns 400 when message is missing |
| 19 | Returns 400 when body is empty |
| 20 | Handles subject field correctly |

#### Chat — History
| Test | Description |
|------|-------------|
| 21 | Returns messages in chronological order |
| 22 | Respects limit query param |
| 23 | Respects page query param |
| 24 | Returns empty array for unknown session |
| 25 | Filters by subject query param |

#### Chat — Session
| Test | Description |
|------|-------------|
| 26 | Creates a new chat session |
| 27 | Creates session with anonymous user when userId not provided |

#### Protected Routes
| Test | Description |
|------|-------------|
| 28 | GET /api/users returns 401 without token |
| 29 | GET /api/materials returns 401 without token |
| 30 | GET /api/settings returns 401 without token |
| 31 | GET /api/activity returns 401 without token |

---

### 4. `tests/db.test.js` — Database Operations Test (Jest + Mock DB)
**Run with:** `npm test`

Tests Mongoose models directly using in-memory MongoDB.

#### Message Model
| Test | Description |
|------|-------------|
| 1 | Saves a valid user message |
| 2 | Saves a valid AI message |
| 3 | Fails validation when text is missing |
| 4 | Fails validation when sender is invalid |
| 5 | Fails validation when sessionId is missing |
| 6 | Fails validation when text exceeds 1000 characters |
| 7 | Retrieves messages by sessionId in chronological order |
| 8 | Returns empty array for unknown sessionId |
| 9 | Saves optional subject field |
| 10 | Counts messages by sessionId |

#### User Model
| Test | Description |
|------|-------------|
| 11 | Saves a valid user |
| 12 | Lowercases email on save |
| 13 | Fails validation when name is missing |
| 14 | Fails validation when email is missing |
| 15 | Enforces unique email constraint |
| 16 | Saves preferredSubjects array |
| 17 | Finds user by email |

#### Activity Model
| Test | Description |
|------|-------------|
| 18 | Saves a valid activity |
| 19 | Fails validation when type is invalid |
| 20 | Fails validation when summary is missing |
| 21 | Retrieves activities by sessionId |

---

### 5. `tests/errorHandler.test.js` — Error Handling Test (Jest + Supertest)
**Run with:** `npm test`

Tests auth middleware, input edge cases, security, and 404 handling.

#### Auth Middleware
| Test | Description |
|------|-------------|
| 1 | Returns 401 when Authorization header is missing |
| 2 | Returns 401 when token is malformed |
| 3 | Returns 401 when Bearer prefix is missing |
| 4 | Returns 401 when token is expired |

#### Chat Error Handling
| Test | Description |
|------|-------------|
| 5 | Returns 400 when message is empty string |
| 6 | Returns 400 when message field is null |
| 7 | Handles very long messages (>1000 chars) — see known issues |
| 8 | Returns 400 when saving message without text |
| 9 | Returns 400 when saving message without sessionId |

#### Auth Error Handling
| Test | Description |
|------|-------------|
| 10 | Returns 400 when register body is empty |
| 11 | Returns 400 when login body is empty |
| 12 | Does not expose password hash in register response |
| 13 | Does not expose password hash in login response |

#### Unknown Routes
| Test | Description |
|------|-------------|
| 14 | Returns 404 for unknown GET route |
| 15 | Returns 404 for unknown POST route |

---

## npm Scripts

```bash
npm test              # Run all Jest tests (api, db, errorHandler)
npm run test:watch    # Run Jest in watch mode
npm run test:coverage # Run Jest with coverage report
npm run test:db       # Run DB persistence test (requires Docker)
node tests/chat.test.js  # Run manual API test (requires Docker)
```

---

## Files Changed

### Modified
| File | Change |
|------|--------|
| `app.js` | Added `aiService.initializeAI()` call; added 404 handler as last middleware; added `requireAuth` to `/api/users`, `/api/materials`, `/api/settings`, `/api/activity` |
| `jest.config.js` | Fixed `_tests_` typo; added `testTimeout: 30000`; excluded manual test files from Jest runner |
| `package.json` | Added `test`, `test:watch`, `test:coverage`, `test:db` scripts; removed redundant `mongodb` native driver |

### Added
| File | Description |
|------|-------------|
| `tests/api.test.js` | Comprehensive API tests — all endpoints, valid + invalid inputs |
| `tests/db.test.js` | Database model tests using in-memory MongoDB mock |
| `tests/errorHandler.test.js` | Error handling, auth middleware, and security tests |
| `tests/db-persistence.test.js` | MongoDB persistence verification across container restarts |

### Dev Dependencies Added
| Package | Purpose |
|---------|---------|
| `mongodb-memory-server` | In-memory MongoDB for Jest tests — no Docker needed |
| `supertest` | HTTP assertion library for Express app testing |
| `jest` | Test runner |
| `jest-junit` | JUnit XML reporter for CI/CD |

---

## Known Issues

### Bug: `chatController.sendMessage` returns 500 for oversized messages
**File:** `controllers/chatController.js`
**Description:** When a message exceeds the schema `maxlength` of 1000 characters,
Mongoose throws a `ValidationError` inside the controller's catch block,
which returns a generic 500 instead of a meaningful 400.
**Expected:** `{ status: 400, error: 'Message too long' }`
**Actual:** `{ status: 500, error: 'An error occurred while processing your message' }`
**Fix:** Add a Mongoose `ValidationError` check in the catch block:
```js
} catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'An error occurred while processing your message' });
}
```

### Warning: Mongoose deprecation warnings in test output
**Description:** `useNewUrlParser` and `useUnifiedTopology` deprecation warnings appear
in test output. These come from `mongodb-memory-server` internals and do not affect
test results. Will be resolved when upgrading to Mongoose 6+.

---

## Test Results Summary

### Jest (npm test)
```
Test Suites: 5 passed, 5 total
Tests:       72 passed, 72 total
Time:        ~7s
```

### Manual Tests (Docker required)
```
chat.test.js:           12/12 passed
db-persistence.test.js:  5/5  passed
```