import React, { useState, useEffect } from 'react';
import styles from '../styles/ChatInterface.modules.css';
import { getAvailableChatFeatures } from '../utils/chatFeatures';  // ← Add this import

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const features = getAvailableChatFeatures();  // ← Add this line

  // Function to load chat history with pagination
  const loadChatHistory = async (sessionId, pageNum = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/api/chat/history/${sessionId}?page=${pageNum}&limit=20`
      );
      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat history when component mounts or session changes
  useEffect(() => {
    if (sessionId) {
      loadChatHistory(sessionId, 1);
    }
  }, [sessionId]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !sessionId) return;

    try {
      const response = await fetch('http://localhost:4000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageInput,
          sender: 'user',
          sessionId: sessionId,
          metadata: {}
        })
      });

      if (response.ok) {
        setMessageInput('');
        loadChatHistory(sessionId, page);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {isLoading && <p>Loading messages...</p>}
        {messages.map((msg) => (
          <div key={msg._id} className={styles.message}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => loadChatHistory(sessionId, page - 1)} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => loadChatHistory(sessionId, page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}

      {/* Progressive Enhancement - Show features only if supported */}
      {features.voiceInput && <div className={styles.voiceInputContainer}>
        <button>🎤 Voice Input</button>
      </div>}

      {features.offlineSupport && <div className={styles.offlineIndicator}>
        ✓ Offline Support Available
      </div>}

      <div className={styles.inputContainer}>
        <input
          className={styles.messageInput}
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button className={styles.sendButton} onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;