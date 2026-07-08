import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import MessageList from './MessageList';

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

function generateMockAIResponse(text, subject) {
  const detected = detectSubjectLocally(text);
  const activeSubject = detected !== 'general' ? detected : subject;

  if (activeSubject === 'math') {
    return `Math is the study of numbers, shapes, and patterns to solve problems and describe the world around us.

Math is a way of describing and understanding the world by using numbers, shapes, and logical rules. It's a way of thinking and problem-solving that helps us make sense of the world, from counting how many apples we have in a basket to understanding the movement of planets in space. Math is a tool that allows us to express and analyze relationships between different things, and it has been used by humans for thousands of years to solve problems, make predictions, and create new technologies.

For example, imagine you're on a road trip and you need to know how far it is to your destination. You can use math to calculate the distance, taking into account the speed of your car and the time it will take to get there. Math helps us make sense of the world and navigate through it.

Did you know that math is all around us, from the intricate patterns on a butterfly's wings to the geometry of a basketball hoop? Math is a fundamental language that helps us describe the world and understand its secrets. Even nature, with its intricate patterns and shapes, uses math to create its beauty.`;
  }
  if (activeSubject === 'science') {
    return `Science explains how the natural world works.\n\nFor example, **photosynthesis** is the process plants use to convert sunlight, carbon dioxide, and water into oxygen and energy (glucose).\n\nIf you have questions about biology, chemistry, or physics, tell me and we'll unpack the concept.`;
  }
  if (activeSubject === 'history') {
    return `Let's look at history step by step.\n\nHistory is full of stories about how our world was shaped.\n\nFor instance, the **capital of the Philippines** is Manila. It has been a historical center of governance and trade for centuries.\n\nAsk me about a historical event or period, and I can give you the details.`;
  }
  if (activeSubject === 'english') {
    return `English and language learning are all about practice.\n\nTo write a strong sentence, ensure your **subject** and **verb** agree. For instance: "The student *studies* diligently" (singular) vs "The students *study* diligently" (plural).\n\nTell me if you want help with grammar, reading, or essays.`;
  }
  return `Hello. I'm your BrainBytes AI Tutor. I can help you learn Science, Mathematics, History, and English.\n\nAsk me a focused question, and I'll explain it clearly step by step.`;
}

export default function ChatPanel({
  profile,
  subject,
  setSubject,
  sessionIds,
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

  // Determine current sessionId for active subject
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
      // Update sessionIds state in parent
      setTimeout(() => {
        setSessionIds((prev) => {
          const updated = { ...prev, [subject]: id };
          localStorage.setItem('brainbytesSessionIds', JSON.stringify(updated));
          return updated;
        });
      }, 0);
    }
    return id;
  })();

  /* ---------------- LOAD HISTORY (LOCAL & BACKEND) ---------------- */
  async function loadHistory() {
    if (!subject) return;
    
    // 1. Load from Local Storage First
    const cached = JSON.parse(
      localStorage.getItem(`brainbytes_messages_${subject}`) || '[]'
    );
    setMessages(cached);
    setError('');

    // 2. Fetch from backend if online and not a Google sandbox user and DB is connected
    if (profile.isGoogleUser || !sessionId || !dbConnected) return;
    
    try {
      const response = await api.get(`/messages/${sessionId}`);
      const history = response.data.messages || response.data || [];
      if (Array.isArray(history)) {
        setMessages(history);
        localStorage.setItem(
          `brainbytes_messages_${subject}`,
          JSON.stringify(history)
        );
      }
    } catch (err) {
      console.warn('Backend history error:', err.message);
      // Keep using cached local storage chats if backend fails
    }
  }

  useEffect(() => {
    loadHistory();
  }, [subject, sessionId, newChatTrigger]);

  /* ---------------- SCROLL + READ RECEIPT ---------------- */
  useEffect(() => {
    readReceiptRef.current?.scrollIntoView({ behavior: 'smooth' });

    const unreadAI = messages.some((m) => m.sender === 'ai' && !m.readAt);
    if (unreadAI && sessionId && !profile.isGoogleUser) {
      api.post(`/messages/read/${sessionId}`).catch(() => {});
    }
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  async function sendMessage(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setLoading(true);
    setError('');

    // Trigger timer activity wakeup
    onQuestionAsked?.();

    // Create temporary user message
    const tempUserMessage = {
      _id: `temp-${Date.now()}`,
      text: userText,
      sender: 'user',
      subject,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, tempUserMessage];
    setMessages(nextMessages);
    localStorage.setItem(
      `brainbytes_messages_${subject}`,
      JSON.stringify(nextMessages)
    );

    // Call backend API (if offline or fails, fall back to offline local simulation)
    try {
      const response = await api.post('/messages', {
        text: userText,
        sessionId,
        subject,
        skipSave: profile.isGoogleUser === true || !dbConnected,
      });

      const userMsg = response.data.userMessage;
      const aiMsg = response.data.aiMessage;
      const detectedCat = response.data.category || subject;

      if (detectedCat !== subject) {
        // Remove temp user message from current subject
        const cleanedCurrent = messages.filter((m) => m._id !== tempUserMessage._id);
        setMessages(cleanedCurrent);
        localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(cleanedCurrent));

        // Save under target subject
        const targetCached = JSON.parse(localStorage.getItem(`brainbytes_messages_${detectedCat}`) || '[]');
        userMsg.subject = detectedCat;
        aiMsg.subject = detectedCat;
        const updatedTarget = [...targetCached, userMsg, aiMsg];
        localStorage.setItem(`brainbytes_messages_${detectedCat}`, JSON.stringify(updatedTarget));

        // Switch dropdown
        setSubject(detectedCat);

        if (onSubjectDetected) {
          onSubjectDetected(detectedCat);
        }
      } else {
        const finalMessages = [
          ...messages.filter((m) => m._id !== tempUserMessage._id),
          userMsg,
          aiMsg,
        ];
        setMessages(finalMessages);
        localStorage.setItem(
          `brainbytes_messages_${subject}`,
          JSON.stringify(finalMessages)
        );

        if (onSubjectDetected) {
          onSubjectDetected(detectedCat);
        }
      }

      onActivityRefresh?.();
    } catch (err) {
      console.warn('Message send failed, falling back to local simulation:', err.message);

      // Save to offline queue if not google user
      if (!profile.isGoogleUser) {
        const offline = JSON.parse(
          localStorage.getItem('offlineMessages') || '[]'
        );
        localStorage.setItem(
          'offlineMessages',
          JSON.stringify([...offline, { message: userText, subject, sessionId }])
        );
      }

      // Generate local mock response for offline support
      const detected = detectSubjectLocally(userText);
      const targetSubject = detected !== 'general' ? detected : subject;
      const mockResponse = generateMockAIResponse(userText, targetSubject);

      const offlineUserMsg = {
        _id: `offline-user-${Date.now()}`,
        text: userText,
        sender: 'user',
        subject: targetSubject,
        timestamp: new Date(),
      };
      
      const offlineAiMsg = {
        _id: `offline-ai-${Date.now()}`,
        text: mockResponse + (profile.isGoogleUser ? '' : '\n\n*(Note: You are currently offline. Message saved for sync.)*'),
        sender: 'ai',
        subject: targetSubject,
        timestamp: new Date(),
      };

      if (targetSubject !== subject) {
        // Remove temp user message from current subject
        const cleanedCurrent = messages.filter((m) => m._id !== tempUserMessage._id);
        setMessages(cleanedCurrent);
        localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify(cleanedCurrent));

        // Save both messages in target subject
        const targetCached = JSON.parse(localStorage.getItem(`brainbytes_messages_${targetSubject}`) || '[]');
        const updatedTarget = [...targetCached, offlineUserMsg, offlineAiMsg];
        localStorage.setItem(`brainbytes_messages_${targetSubject}`, JSON.stringify(updatedTarget));

        // Switch active subject dropdown
        setSubject(targetSubject);

        if (onSubjectDetected) {
          onSubjectDetected(targetSubject);
        }
      } else {
        const finalOffline = [
          ...messages.filter((m) => m._id !== tempUserMessage._id),
          offlineUserMsg,
          offlineAiMsg,
        ];
        setMessages(finalOffline);
        localStorage.setItem(
          `brainbytes_messages_${subject}`,
          JSON.stringify(finalOffline)
        );

        if (onSubjectDetected) {
          onSubjectDetected(targetSubject);
        }
      }

      if (!profile.isGoogleUser) {
        setError('Message saved offline. Showing cached response.');
      } else {
        setError('Showing local fallback response.');
      }
      onActivityRefresh?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat">
      {/* Sub-Navbar - Status Bar & Subject Select */}
      <div className="status-bar">
        <div className="learning-status">
          <span className="status-dot"></span>
          <span className="learning-text">
            {profile?.name ? `Learning as ${profile.name}` : 'Learning as Guest'}
          </span>
        </div>
        <div className="subject-container">
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            className="subject-select"
          >
            {subjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="message-container">
        <MessageList
          messages={messages}
          loading={loading}
          readReceiptRef={readReceiptRef}
          profile={profile}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {/* Footer - Sticky Bottom Input Area */}
      <form onSubmit={sendMessage} className="input-area">
        <button type="button" className="plus-button" aria-label="Add file or prompt template">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="textarea-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
        </div>
        <button type="submit" disabled={loading || !input.trim()} className="send-button" aria-label="Send">
          <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 1L1 8L7 10L18 1Z" fill="white"/>
            <path d="M18 1L7 10V15L10 11.5L14.5 14.5L18 1Z" fill="white"/>
          </svg>
        </button>
      </form>

      <style jsx="true">{`
        .chat {
          height: calc(100vh - 108px); /* Height minus Header and margins */
          background: var(--bg-layout);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.05);
          width: 100%;
        }

        /* Status bar */
        .status-bar {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          height: 63px;
          background: var(--bg-layout);
          border-bottom: 1px solid var(--border-light);
          backdrop-filter: blur(6px);
          flex-shrink: 0;
          z-index: 5;
        }

        .learning-status {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 16px;
          gap: 8px;
          height: 38px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          border-radius: 9999px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #22C55E;
          border-radius: 9999px;
          display: inline-block;
        }

        .learning-text {
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0.14px;
          color: var(--text-secondary);
        }

        .subject-select {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 16px;
          width: 182px;
          height: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-family: 'Public Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0.14px;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
        }

        .message-container {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .error {
          margin: 0;
          padding: 8px 16px;
          color: #B91C1C;
          background: #FEF2F2;
          border-top: 1px solid #FCA5A5;
          font-size: 14px;
          font-family: 'Public Sans', sans-serif;
        }

        /* Footer input area */
        .input-area {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 16px;
          gap: 12px;
          background: var(--bg-layout);
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .plus-button {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 12px;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--button-plus-bg);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .plus-button:hover {
          background-color: var(--bg-input);
        }

        .textarea-container {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          height: 48px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          flex-grow: 1;
        }

        textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 24px;
          color: var(--text-primary);
        }

        textarea::placeholder {
          color: var(--text-muted);
        }

        .send-button {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 48px;
          height: 48px;
          background: var(--accent-blue);
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
        }

        .send-button:hover {
          background: #003fa8;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .chat {
            height: calc(100vh - 100px);
          }
          
          .status-bar {
            height: auto;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 10px 12px;
          }

          .subject-select {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .learning-status {
            padding: 6px 12px;
            height: 32px;
          }

          .learning-text {
            font-size: 12px;
          }

          .subject-select {
            height: 32px;
            font-size: 12px;
            padding: 6px 12px;
          }

          .input-area {
            padding: 10px;
            gap: 8px;
          }

          .plus-button {
            width: 38px;
            height: 38px;
            padding: 8px;
          }

          .textarea-container {
            height: 38px;
            padding: 6px 12px;
            border-radius: 12px;
          }

          textarea {
            font-size: 14px;
            line-height: 20px;
          }

          .send-button {
            width: 38px;
            height: 38px;
            border-radius: 8px;
          }
        }
      `}</style>
    </section>
  );
}
