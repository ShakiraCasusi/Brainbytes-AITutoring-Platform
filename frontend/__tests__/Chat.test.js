import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../components/Chat';
import { api } from '../utils/api';

// Mock scrollIntoView which is missing in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock the api Axios client
jest.mock('../utils/api', () => {
  const mockApi = {
    get: jest.fn().mockResolvedValue({ data: { messages: [] } }),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    api: mockApi,
    getToken: jest.fn(() => null),
    setToken: jest.fn(),
    API_BASE_URL: 'http://localhost:4000/api',
    WS_URL: 'ws://localhost:4000/ws',
  };
});

// Setup global fetch mock
global.fetch = jest.fn();

// Translate api.post calls to global.fetch so that standard fetch mocking works
api.post.mockImplementation((url, data) => {
  return global
    .fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    .then((res) => {
      if (res.json) {
        return res.json();
      }
      return res;
    })
    .then((jsonData) => ({ data: jsonData }));
});

test('shows loading indicator while waiting for response', async () => {
  // Mock fetch to delay response
  fetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            json: () =>
              Promise.resolve({
                userMessage: { text: 'Hello' },
                aiMessage: { text: 'Hi there' },
              }),
          });
        }, 100);
      })
  );

  render(<Chat />);

  // Type and submit a message
  const input = screen.getByPlaceholderText(/type your question/i);
  fireEvent.change(input, { target: { value: 'Hello' } });
  const button = screen.getByRole('button', { name: /send/i });
  fireEvent.click(button);

  // Check for loading indicator
  expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

  // Wait for response
  await waitFor(() => {
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
});

test('shows error message when API call fails', async () => {
  // Mock fetch to reject
  fetch.mockRejectedValueOnce(new Error('Network error'));

  render(<Chat />);

  // Type and submit a message
  const input = screen.getByPlaceholderText(/type your question/i);
  fireEvent.change(input, { target: { value: 'Hello' } });
  const button = screen.getByRole('button', { name: /send/i });
  fireEvent.click(button);

  // Check for error message
  await waitFor(() => {
    expect(screen.getByText(/Message saved offline/i)).toBeInTheDocument();
  });
});
