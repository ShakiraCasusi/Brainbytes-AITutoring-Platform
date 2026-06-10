# BrainBytes Testing Strategy

## Overview

This document outlines the testing approach for the BrainBytes AI Tutoring Platform, including testing levels, tools, patterns, guidelines, and instructions for running and debugging tests.

---

## Testing Levels

### Unit Testing
- **Frontend**: Verify individual React components in isolation (mocking API connections and browser environment constraints).
- **Backend**: Verify individual functions, handlers, and utility modules without active database connections.

### Integration Testing
- Verify API endpoints using Express routes and handlers with mocked data sources.
- Verify database service mapping and transaction mock calls.

### End-to-End Testing
- Validate full user flows, websocket broadcasts, and frontend/backend interactions (future implementation).

---

## Testing Tools

- **Jest**: The primary test runner and assertion framework for both the frontend and the backend.
- **React Testing Library**: For testing React components in a user-centric manner.
- **Supertest**: An HTTP assertion library used for testing Express routes and middleware.
- **Jest Mocks**: For stubbing out external service calls (e.g., Hugging Face APIs) and database models.

---

## Code Quality

- **ESLint**: Static analysis tool configured with Flat Config (v9) to enforce style, avoid syntax errors, and capture logical anti-patterns across different folders.
- **Prettier**: Code formatter integrated directly with ESLint to keep line lengths, quotes, and layouts consistent.
- **GitHub Actions**: Automated CI/CD pipelines executing parallel linting, frontend tests, and backend tests.

---

## Detailed Testing Examples

### 1. React Component Interaction Test
Here is an example of verifying the `ChatInput` component's behavior using React Testing Library in [ChatInput.test.js](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/frontend/__tests__/ChatInput.test.js):
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../components/ChatInput';

test('submits message when user clicks send', () => {
  const handleSubmit = jest.fn();
  render(<ChatInput onSubmit={handleSubmit} />);
  
  // Type in the input
  const input = screen.getByPlaceholderText(/type your question/i);
  fireEvent.change(input, { target: { value: 'Test message' } });
  
  // Click the send button
  const button = screen.getByRole('button', { name: /send/i });
  fireEvent.click(button);
  
  // Verify the handler was called with the right argument
  expect(handleSubmit).toHaveBeenCalledWith('Test message');
  expect(input.value).toBe(''); // Input should be cleared
});

test('does not submit empty messages', () => {
  const handleSubmit = jest.fn();
  render(<ChatInput onSubmit={handleSubmit} />);
  
  // Click without typing anything
  const button = screen.getByRole('button', { name: /send/i });
  fireEvent.click(button);
  
  // Verify the mock handler was not called
  expect(handleSubmit).not.toHaveBeenCalled();
});
```

### 2. Express API Integration Test (with Supertest)
Here is an example of checking API route status and response fields in [chatApi.test.js](file:///c:/Users/krscu/OneDrive/Dokumen/brainbytes-multi-containers/backend/__tests__/chatApi.test.js):
```javascript
const request = require('supertest');
const app = require('../app');

describe('Chat API', () => {
  test('POST /api/chat/send returns correct response', async () => {
    const response = await request(app)
      .post('/api/chat/send')
      .send({
        message: 'Hello AI',
        sessionId: 'test-session'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('userMessage');
    expect(response.body).toHaveProperty('aiMessage');
    expect(response.body.userMessage.text).toBe('Hello AI');
  });
});
```

---

## Testing Patterns & Best Practices

1. **Database Layer Mocking**: Never make real database calls during unit tests. Mock Mongoose models and stub queries using `jest.mock`.
2. **Network Request Mocking**: Intercept API requests (e.g., `axios` or global `fetch` calls) and return defined mock data.
3. **Resetting Mocks**: Use `jest.clearAllMocks()` in a `beforeEach()` hook to ensure test runs are entirely independent.
4. **Scoping Configurations**: Ensure that test runners only execute matching file patterns (`*.test.js`) and ignore build directories (like `.next/` or `node_modules/`).

---

## Running and Debugging Tests

### Running the Suite
To run all tests locally:
```bash
# In the frontend directory
npm test

# In the backend directory
npm test
```

### Debugging with console.log
You can log values directly inside test cases to inspect state:
```javascript
test('debug with console.log', () => {
  const result = yourFunction();
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### Debugging DOM Output
Use React Testing Library's `debug` helper to print HTML structures:
```javascript
test('debug component output', () => {
  const { debug } = render(<YourComponent />);
  debug(); // Prints the rendered component DOM to console
});
```

### Running Specific Tests
To target a single test suite or a specific test by name:
```bash
# Run tests matching a regex pattern
npm test -- -t "name of your test"
```

---

## Future Enhancements

- Integrate end-to-end tests using Playwright.
- Generate and upload coverage reports to Codecov or similar integrations.
- Set up performance budget checks using Lighthouse CI.
