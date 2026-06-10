import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../components/ChatInput';

test('allows users to type and submit messages', () => {
  const mockSubmit = jest.fn();
  render(<ChatInput onSubmit={mockSubmit} />);

  // Find the input and button
  const input = screen.getByPlaceholderText(/type your question/i);
  const button = screen.getByRole('button', { name: /send/i });

  // Type a message
  fireEvent.change(input, { target: { value: 'Hello AI' } });

  expect(input.value).toBe('Hello AI');

  // Submit the message
  fireEvent.click(button);
  expect(mockSubmit).toHaveBeenCalledWith('Hello AI');
  expect(input.value).toBe(''); // Input should be cleared after submission
});
