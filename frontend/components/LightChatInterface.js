import React, { useState } from 'react';

function LightChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Simplified version without animations, pagination, etc.
  return (
    <div style={{ padding: '10px' }}>
      <div style={{ height: '80vh', overflow: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Message..."
      />
      <button>Send</button>
    </div>
  );
}

export default LightChatInterface;