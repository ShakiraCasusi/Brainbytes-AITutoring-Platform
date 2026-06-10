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

  // Verify the handler was not called
  expect(handleSubmit).not.toHaveBeenCalled();
});
