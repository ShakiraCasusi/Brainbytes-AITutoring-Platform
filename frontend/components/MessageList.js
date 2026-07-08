import { formatMessage } from '../utils/formatMessage';

function MessageContent({ text }) {
  return formatMessage(text).map((part) => {
    if (part.type === 'code') {
      return (
        <pre key={part.key}>
          <code>{part.value}</code>
        </pre>
      );
    }
    if (part.type === 'list') {
      return (
        <ul key={part.key}>
          {part.value.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p
        key={part.key}
        dangerouslySetInnerHTML={{
          __html: part.value
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br/>'),
        }}
      />
    );
  });
}

export default function MessageList({ messages, loading, readReceiptRef, profile }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="messages-thread">
      {messages.length === 0 ? (
        <div className="welcome">
          <h2>Ask a focused question</h2>
          <p>
            Choose a subject, then ask for a definition, explanation, example,
            or steps.
          </p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const isGuest = !profile || !profile.name;
          const timeStr = formatTime(message.timestamp || message.createdAt);
          return (
            <div
              key={message._id || message.timestamp || index}
              className={`message-row ${isUser ? 'user-row' : 'ai-row'}`}
            >
              {/* Avatar */}
              <div className={`avatar ${isUser ? (isGuest ? 'user-avatar bg-guest' : 'user-avatar') : 'ai-avatar'}`}>
                {isUser ? (
                  profile && profile.avatar ? (
                    <img src={profile.avatar} alt="User Avatar" className="user-avatar-img" />
                  ) : (
                    <span className="avatar-initials">
                      {profile && profile.name ? profile.name.charAt(0).toUpperCase() : 'G'}
                    </span>
                  )
                ) : (
                  <img src="/brain.png" alt="BrainBytes AI" className="ai-avatar-img" />
                )}
              </div>

              {/* Bubble & Timestamp Text */}
              <div className="bubble-wrapper">
                <article className={`bubble ${isUser ? 'user-bubble user' : 'ai-bubble ai'}`}>
                  <div className="bubble-text">
                    <MessageContent text={message.text} />
                  </div>
                  <div className="bubble-meta" suppressHydrationWarning>
                    {isUser ? `YOU - ${timeStr || 'NOW'}` : `BRAINBYTES AI - ${timeStr || 'NOW'}`}
                  </div>
                </article>
              </div>
            </div>
          );
        })
      )}

      {loading && (
        <div className="message-row ai-row">
          {/* Robot Avatar replaced with Brain logo */}
          <div className="avatar ai-avatar">
            <img src="/brain.png" alt="BrainBytes AI" className="ai-avatar-img" />
          </div>
          <div className="bubble-wrapper">
            <article className="bubble ai-bubble loader-bubble ai typing" data-testid="loading-indicator">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </article>
          </div>
        </div>
      )}
      <div ref={readReceiptRef} />

      <style jsx="true">{`
        .messages-thread {
          flex: 1;
          overflow-y: auto;
          padding: 32px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: var(--bg-layout);
          box-sizing: border-box;
        }

        .welcome {
          margin: auto;
          max-width: 500px;
          text-align: center;
          color: var(--text-secondary);
          font-family: 'Public Sans', sans-serif;
          padding: 32px;
        }

        .welcome h2 {
          font-family: 'Lexend', sans-serif;
          margin: 0 0 12px;
          color: var(--accent-blue);
          font-size: 24px;
          font-weight: 700;
        }

        .welcome p {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-muted);
        }

        .message-row {
          display: flex;
          width: 100%;
          gap: 12px;
          align-items: flex-start;
        }

        .user-row {
          flex-direction: row-reverse;
        }

        .ai-row {
          flex-direction: row;
        }

        .avatar {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
          margin-top: 4px;
          overflow: hidden;
        }

        .ai-avatar {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .ai-avatar-img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .user-avatar {
          background: var(--accent-orange);
        }

        .user-avatar.bg-guest {
          background: #9CA3AF !important;
        }

        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          color: white;
          font-weight: 700;
          font-family: 'Lexend', sans-serif;
          font-size: 14px;
        }

        .bubble-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 85%;
        }

        .user-row .bubble-wrapper {
          align-items: flex-end;
        }

        .ai-row .bubble-wrapper {
          align-items: flex-start;
        }

        .bubble {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          gap: 6px;
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          font-family: 'Public Sans', sans-serif;
        }

        .ai-bubble {
          background: var(--bubble-ai-bg);
          border: 1px solid var(--border-color);
          border-radius: 0px 12px 12px 12px;
        }

        .user-bubble {
          background: var(--bubble-user-bg);
          border-radius: 12px 0px 12px 12px;
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .loader-bubble {
          padding: 12px 16px;
        }

        .bubble-text {
          font-size: 16px;
          line-height: 24px;
          word-break: break-word;
          text-align: left;
          width: 100%;
        }

        .ai-bubble .bubble-text {
          color: var(--bubble-ai-text);
        }

        .user-bubble .bubble-text {
          color: var(--bubble-user-text);
        }

        .bubble-meta {
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 700;
          font-size: 10px;
          line-height: 15px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .ai-bubble .bubble-meta {
          color: var(--text-light);
          text-align: left;
        }

        .user-bubble .bubble-meta {
          color: rgba(219, 225, 255, 0.7);
          text-align: right;
        }

        pre {
          overflow-x: auto;
          background: #102033;
          color: #FAF8FF;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          margin: 8px 0;
          max-width: 100%;
          text-align: left;
        }

        ul {
          padding-left: 20px;
          margin: 8px 0;
          text-align: left;
        }

        li {
          margin-bottom: 4px;
        }

        p {
          margin: 0;
        }

        /* Typing indicator dots */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 10px;
        }

        .typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }

        .typing-indicator span:nth-child(1) {
          background: rgba(0, 74, 198, 0.3);
          animation-delay: 0s;
        }

        .typing-indicator span:nth-child(2) {
          background: rgba(0, 74, 198, 0.4);
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          background: rgba(0, 74, 198, 0.5);
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          from {
            opacity: 0.35;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @media (max-width: 768px) {
          .messages-thread {
            padding: 16px 8px;
            gap: 20px;
          }

          .bubble {
            padding: 12px 14px;
          }

          .bubble-text {
            font-size: 15px;
            line-height: 22px;
          }
        }

        @media (max-width: 480px) {
          .messages-thread {
            padding: 12px 4px;
            gap: 16px;
          }

          .avatar {
            width: 28px;
            height: 28px;
            margin-top: 2px;
          }

          .avatar-initials {
            font-size: 12px;
          }

          .ai-avatar-img {
            width: 20px;
            height: 20px;
          }

          .bubble {
            padding: 10px 12px;
            border-radius: 12px;
          }

          .bubble-text {
            font-size: 14px;
            line-height: 20px;
          }

          pre {
            padding: 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
