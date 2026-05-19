import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import MessageList from './MessageList';

const subjects = ['general', 'math', 'science', 'history', 'english'];

export default function ChatPanel({ profile, onActivityRefresh }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const readReceiptRef = useRef(null);
  const sessionId = typeof window !== 'undefined'
    ? localStorage.getItem('chatSessionId') || `${Date.now()}`
    : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('chatSessionId', sessionId);
    loadHistory();
  }, [subject]);

  useEffect(() => {
    readReceiptRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.some((message) => message.sender === 'ai' && !message.readAt)) {
      api.post(`/chat/read/${sessionId}`).catch(() => {});
    }
  }, [messages]);

  async function loadHistory() {
    try {
      const response = await api.get(`/chat/history/${sessionId}`, { params: { subject } });
      setMessages(response.data.messages || []);
    } catch {
      setError('Chat history is unavailable. New messages will retry when the API is reachable.');
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const pending = { _id: `local-${Date.now()}`, text: input, sender: 'user', timestamp: new Date() };
    setMessages((current) => [...current, pending]);
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/chat/send', { message: input, sessionId, subject });
      setMessages((current) => current.filter((item) => item._id !== pending._id).concat([
        response.data.userMessage,
        response.data.aiMessage
      ]));
      setInput('');
      onActivityRefresh();
    } catch {
      const offline = JSON.parse(localStorage.getItem('offlineMessages') || '[]');
      localStorage.setItem('offlineMessages', JSON.stringify([...offline, { message: input, subject, sessionId }]));
      setError('Message saved offline. It will be available here for retry when the API is back.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat">
      <header>
        <div>
          <h2>Chat tutor</h2>
          <p>{profile.name ? `Learning as ${profile.name}` : 'Create a profile to personalize responses'}</p>
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </header>
      <MessageList messages={messages} loading={loading} readReceiptRef={readReceiptRef} />
      {error && <p className="error">{error}</p>}
      <form onSubmit={sendMessage}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your question..." />
        <button disabled={loading}>Send</button>
      </form>
      <style jsx>{`
        .chat { height: calc(100vh - 48px); background: white; border: 1px solid #dde3ee; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border-bottom: 1px solid #e7ecf3; }
        h2 { margin: 0; font-size: 24px; line-height: 1.2; }
        p { margin: 4px 0 0; color: #5c667a; line-height: 1.5; }
        select, input { border: 1px solid #cbd3df; border-radius: 6px; padding: 10px; font: inherit; }
        form { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 14px; border-top: 1px solid #e7ecf3; }
        button { background: #2f80ed; color: white; border: none; border-radius: 6px; padding: 0 18px; font-weight: 800; cursor: pointer; }
        button:disabled { background: #9fb3d1; }
        .error { margin: 0; padding: 10px 14px; color: #8a2b2b; background: #fff1f1; }
        @media (max-width: 760px) {
          .chat { height: calc(100vh - 138px); }
          header { align-items: stretch; flex-direction: column; }
        }
      `}</style>
    </section>
  );
}
