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

  /* ---------------- FIXED SESSION ---------------- */
  const sessionId =
    typeof window !== 'undefined'
      ? (() => {
          let id = localStorage.getItem('chatSessionId');
          if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('chatSessionId', id);
          }
          return id;
        })()
      : '';

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    if (!sessionId) return;
    loadHistory();
  }, [sessionId]);

  async function loadHistory() {
    try {
      const response = await api.get(`/messages/${sessionId}`);

      setMessages(response.data || []);
    } catch (err) {
      console.warn('History error:', err.message);
      setError('Chat history unavailable.');
    }
  }

  /* ---------------- SCROLL + READ RECEIPT ---------------- */
  useEffect(() => {
    readReceiptRef.current?.scrollIntoView({ behavior: 'smooth' });

    const unreadAI = messages.some(
      (m) => m.sender === 'ai' && !m.readAt
    );

    if (unreadAI) {
      api.post(`/messages/read/${sessionId}`).catch(() => {});
    }
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  async function sendMessage(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const userText = input;

    const temp = {
      _id: `temp-${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, temp]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/messages', {
        text: userText,
        sessionId,
        subject,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== temp._id),
        response.data.userMessage,
        response.data.aiMessage,
      ]);

      onActivityRefresh?.();

    } catch (err) {
      console.error(err);

      const offline = JSON.parse(
        localStorage.getItem('offlineMessages') || '[]'
      );

      localStorage.setItem(
        'offlineMessages',
        JSON.stringify([
          ...offline,
          { message: userText, subject, sessionId },
        ])
      );

      setError(
        'Message saved offline. Will sync when connection returns.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <section className="chat">
      <header>
        <div>
          <h2>Chat tutor</h2>
          <p>
            {profile.name
              ? `Learning as ${profile.name}`
              : 'Create a profile to personalize responses'}
          </p>
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </header>
      <MessageList
        messages={messages}
        loading={loading}
        readReceiptRef={readReceiptRef}
      />
      {error && <p className="error">{error}</p>}
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button disabled={loading}>Send</button>
      </form>
      <style jsx>{`
        .chat {
          height: calc(100vh - 48px);
          background: white;
          border: 1px solid #dde3ee;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          border-bottom: 1px solid #e7ecf3;
        }
        h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
        }
        p {
          margin: 4px 0 0;
          color: #5c667a;
          line-height: 1.5;
        }
        select,
        input {
          border: 1px solid #cbd3df;
          border-radius: 6px;
          padding: 10px;
          font: inherit;
        }
        form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid #e7ecf3;
        }
        button {
          background: #2f80ed;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0 18px;
          font-weight: 800;
          cursor: pointer;
        }
        button:disabled {
          background: #9fb3d1;
        }
        .error {
          margin: 0;
          padding: 10px 14px;
          color: #8a2b2b;
          background: #fff1f1;
        }
        @media (max-width: 760px) {
          .chat {
            height: calc(100vh - 138px);
          }
          header {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}