import React, { useState } from 'react';

export default function ChatInput({ onSubmit }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value.trim());
    }
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type your question..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
}
