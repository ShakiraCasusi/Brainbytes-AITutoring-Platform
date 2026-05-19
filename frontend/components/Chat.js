import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Legacy hard-coded API URL:
// const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate or retrieve session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // Load chat history for returning users
      fetchChatHistory(storedSessionId);
    } else {
      const newSessionId = Date.now().toString();
      localStorage.setItem('chatSessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Fetch chat history
  const fetchChatHistory = async (sid) => {
    try {
      // Legacy hard-coded URL:
      // const response = await axios.get(`http://localhost:3000/api/chat/history/${sid}`);
      const response = await axios.get(`${API_BASE_URL}/chat/history/${sid}`);
      if (response.data.messages && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    setIsLoading(true);
    
    try {
      // Legacy hard-coded URL:
      // const response = await axios.post('http://localhost:3000/api/chat/send', {
      const response = await axios.post(`${API_BASE_URL}/chat/send`, {
        message: input,
        sessionId: sessionId,
      });
      
      if (response.data.userMessage && response.data.aiMessage) {
        // Only add messages if they're not already in the list (prevents duplicates)
        setMessages(prevMessages => {
          const messageIds = prevMessages.map(m => m._id);
          const newMessages = [];
          
          if (!messageIds.includes(response.data.userMessage._id)) {
            newMessages.push(response.data.userMessage);
          }
          
          if (!messageIds.includes(response.data.aiMessage._id)) {
            newMessages.push(response.data.aiMessage);
          }
          
          return [...prevMessages, ...newMessages];
        });
      }
      
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    localStorage.setItem('chatSessionId', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>BrainBytes AI Tutor</h2>
        <button onClick={handleNewChat} className="new-chat-button">
          New Chat
        </button>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to BrainBytes AI Tutor!</h3>
            <p>Ask me any academic question to get started.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${
                msg.sender === 'user' ? 'user-message' : 'ai-message'
              }`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message ai-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          className="message-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-button"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
      
      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 1000px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #2c3e50;
          color: white;
        }
        
        .chat-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .new-chat-button {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        
        .new-chat-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        
        .welcome-message {
          text-align: center;
          margin: 50px auto;
          max-width: 600px;
          color: #666;
        }
        
        .welcome-message h3 {
          font-size: 1.8rem;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        
        .message {
          max-width: 80%;
          margin-bottom: 15px;
          padding: 12px 16px;
          border-radius: 8px;
          line-height: 1.5;
          position: relative;
        }
        
        .user-message {
          background-color: #DCF8C6;
          margin-left: auto;
          border-bottom-right-radius: 2px;
        }
        
        .ai-message {
          background-color: white;
          margin-right: auto;
          border-bottom-left-radius: 2px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .message-time {
          font-size: 0.7rem;
          color: #999;
          text-align: right;
          margin-top: 5px;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background-color: #888;
          display: inline-block;
          margin-right: 5px;
          animation: bounce 1.5s infinite;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
        
        .input-container {
          display: flex;
          padding: 15px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
        }
        
        .message-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .message-input:focus {
          border-color: #2c3e50;
        }
        
        .send-button {
          background-color: #2c3e50;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0 20px;
          margin-left: 10px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
        }
        
        .send-button:hover {
          background-color: #1a2a38;
        }
        
        .send-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .chat-container {
            border-radius: 0;
            border: none;
            height: 100vh;
            width: 100%;
          }
          
          .message {
            max-width: 90%;
          }
          
          .chat-header h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
