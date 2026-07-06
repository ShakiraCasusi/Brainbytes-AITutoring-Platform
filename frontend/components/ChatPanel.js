import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import MessageList from './MessageList';
import styles from '../styles/ChatInterface.module.css'; 

const subjects = [
  { id: 'general', label: 'General' },
  { id: 'math', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
  { id: 'history', label: 'History' },
  { id: 'english', label: 'English' }
];

function detectSubjectLocally(question) {
  const text = question.toLowerCase();
  if (
    /[0-9]\s*[+\-*]/.test(text) ||
    /[0-9]\s*\//.test(text) ||
    /math|calculate|prime number|fraction|geometry|algebra|addition|subtraction/.test(text)
  )
    return 'math';

  if (
    /science|biology|chemistry|physics|plant|water|chemical|photosynthesis|evaporation|molecule|gravity|space/.test(
      text
    )
  )
    return 'science';

  if (/history|war|president|country|capital|colony|empire|dynasty/.test(text)) return 'history';

  if (/essay|grammar|english|sentence|vocabulary|spelling|verb|noun/.test(text)) return 'english';

  return 'general';
}

export default function ChatPanel({
  profile,
  subject = 'general',
  setSubject,
  sessionIds = {},
  setSessionIds,
  newChatTrigger,
  onActivityRefresh,
  onQuestionAsked,
  onSubjectDetected,
  dbConnected = true,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readReceiptRef = useRef(null);

  const sessionId = (() => {
    if (!subject) return '';
    let id = sessionIds[subject];
    if (!id) {
      id = typeof window !== 'undefined' && window.localStorage.getItem('chatSessionId_' + subject);
      if (!id) {
        id = typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `session-${subject}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('chatSessionId_' + subject, id);
        }
      }
      setTimeout(() => {
        if (setSessionIds) {
          setSessionIds((prev) => {
            const updated = { ...prev, [subject]: id };
            localStorage.setItem('brainbytesSessionIds', JSON.stringify(updated));
            return updated;
          });
        }
      }, 0);
    }
    return id;
  })();

  async function loadHistory() {
    if (!subject) return;
    const cached = JSON.parse(localStorage.getItem(`brainbytes_messages_${subject}`) || '[]');
    setMessages(cached);
    setError('');

    if (profile?.isGoogleUser || !sessionId || !dbConnected) return;
    try {
      const response = await api.get(`/messages/${sessionId}`);
      const history = response.data.messages || response.data || [];
      if (Array.isArray(history)) {
        setMessages(history);
        localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(history));
      }
    } catch (err) {
      console.warn('Backend history error:', err.message);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [subject, sessionId, newChatTrigger]);

  useEffect(() => {
    readReceiptRef.current?.scrollIntoView({ behavior: 'smooth' });
    const unreadAI = messages.some((m) => m.sender === 'ai' && !m.readAt);
    if (unreadAI && sessionId && !profile?.isGoogleUser) {
      api.post(`/messages/read/${sessionId}`).catch(() => {});
    }
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setLoading(true);
    setError('');
    onQuestionAsked?.();

    const tempUserMessage = {
      _id: `temp-${Date.now()}`,
      text: userText,
      sender: 'user',
      subject,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, tempUserMessage];
    setMessages(nextMessages);
    localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(nextMessages));

    try {
      const response = await api.post('/messages', {
        text: userText,
        sessionId,
        subject,
        skipSave: profile?.isGoogleUser === true || !dbConnected,
      });

      const userMsg = response.data.userMessage;
      const aiMsg = response.data.aiMessage;
      const detectedCat = response.data.category || subject;

      if (detectedCat !== subject) {
        const cleanedCurrent = messages.filter((m) => m._id !== tempUserMessage._id);
        setMessages(cleanedCurrent);
        localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(cleanedCurrent));

        const targetCached = JSON.parse(localStorage.getItem(`brainbytes_messages_${detectedCat}`) || '[]');
        userMsg.subject = detectedCat;
        aiMsg.subject = detectedCat;
        const updatedTarget = [...targetCached, userMsg, aiMsg];
        localStorage.setItem(`brainbytes_messages_${detectedCat}`, JSON.stringify(updatedTarget));
        
        if (setSubject) setSubject(detectedCat);
        onSubjectDetected?.(detectedCat);
      } else {
        const finalized = [...messages, userMsg, aiMsg];
        setMessages(finalized);
        localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(finalized));
      }
      onActivityRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.badgeHeaderRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ color: '#434655', fontWeight: '500', fontSize: '14px' }}>
            {profile?.name ? `Learning as ${profile.name}` : 'Learning as Guest'}
          </span>
        </div>
        
        <select 
          value={subject} 
          onChange={(e) => setSubject && setSubject(e.target.value)} 
          className={styles.dropdownSelect}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>{sub.label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h2 className={styles.emptyStateTitle}>Ask a focused question</h2>
            <p className={styles.emptyStateSubtitle}>
              Choose a subject, then ask for a definition, explanation, example, or steps.
            </p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={readReceiptRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px', padding: '16px 0', alignItems: 'center' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`${styles.messageInput} ${styles.capsuleInput}`}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: '#004ac6',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: !input.trim() ? 0.5 : 1
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
