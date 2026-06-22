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

export default function MessageList({ messages, loading, readReceiptRef }) {
  return (
    <div className="messages">
      {messages.length === 0 ? (
        <div className="welcome">
          <h2>Ask a focused question</h2>
          <p>
            Choose a subject, then ask for a definition, explanation, example,
            or steps.
          </p>
        </div>
      ) : (
        messages.map((message, index) => (
          <article
            key={message._id || message.timestamp || index}
            className={message.sender === 'user' ? 'user' : 'ai'}
          >
            <MessageContent text={message.text} />
            <span>
              {message.readAt
                ? 'Read'
                : message.timestamp
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : ''}
            </span>
          </article>
        ))
      )}
      {loading && (
        <article className="ai typing" data-testid="loading-indicator">
          <span></span>
          <span></span>
          <span></span>
        </article>
      )}
      <div ref={readReceiptRef} />
      <style jsx>{`
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          background: #f8fafc;
        }
        .welcome {
          margin: 56px auto;
          max-width: 58ch;
          text-align: center;
          color: #5c667a;
        }
        .welcome h2 {
          margin: 0 0 8px;
          color: #172033;
          font-size: 24px;
        }
        .welcome p {
          line-height: 1.5;
        }
        article {
          max-width: 75%;
          margin: 0 0 14px;
          border-radius: 8px;
          padding: 12px 14px;
          line-height: 1.5;
        }
        .user {
          margin-left: auto;
          background: #dff4df;
        }
        .ai {
          margin-right: auto;
          background: white;
          border: 1px solid #e2e8f0;
        }
        span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #7a8496;
          text-align: right;
        }
        pre {
          overflow-x: auto;
          background: #102033;
          color: white;
          padding: 12px;
          border-radius: 6px;
        }
        ul {
          padding-left: 20px;
        }
        p {
          margin: 0;
        }
        .typing span {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin: 0 4px 0 0;
          border-radius: 50%;
          background: #7a8496;
          animation: pulse 1s infinite alternate;
        }
        .typing span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          from {
            opacity: 0.35;
          }
          to {
            opacity: 1;
          }
        }
        @media (max-width: 760px) {
          article {
            max-width: 92%;
          }
        }
      `}</style>
    </div>
  );
}
