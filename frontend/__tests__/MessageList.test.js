import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageList from '../components/MessageList';

describe('MessageList Component Rendering', () => {
  const mockRef = React.createRef();

  it('renders welcome screen when there are no messages', () => {
    render(<MessageList messages={[]} loading={false} readReceiptRef={mockRef} />);
    
    expect(screen.getByText('Ask a focused question')).toBeDefined();
    expect(screen.getByText(/Choose a subject, then ask for a definition/i)).toBeDefined();
  });

  it('renders messages correctly with correct alignment classes', () => {
    const messages = [
      {
        _id: 'msg-1',
        text: 'Hello, how can I help with math?',
        sender: 'ai',
        timestamp: new Date('2026-05-24T10:00:00Z').toISOString()
      },
      {
        _id: 'msg-2',
        text: 'Can you explain evaporation?',
        sender: 'user',
        timestamp: new Date('2026-05-24T10:01:00Z').toISOString()
      }
    ];

    const { container } = render(
      <MessageList messages={messages} loading={false} readReceiptRef={mockRef} />
    );

    // Verify text content is rendered
    expect(screen.getByText('Hello, how can I help with math?')).toBeDefined();
    expect(screen.getByText('Can you explain evaporation?')).toBeDefined();

    // Verify alignment based on sender roles (user class vs ai class)
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(2);
    expect(articles[0].classList.contains('ai')).toBe(true);
    expect(articles[1].classList.contains('user')).toBe(true);
  });

  it('renders typing indicator when loading prop is true', () => {
    const { container } = render(
      <MessageList messages={[]} loading={true} readReceiptRef={mockRef} />
    );

    const typingIndicator = container.querySelector('.typing');
    expect(typingIndicator).toBeDefined();
    expect(typingIndicator.classList.contains('ai')).toBe(true);
  });
});
