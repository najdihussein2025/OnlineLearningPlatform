import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './chatbot.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for the Online Learning Platform. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Chatbot is always enabled - no need to fetch visibility settings
  useEffect(() => {
    setChatbotEnabled(true);
    setLoading(false);
  }, []);

  // Scroll to bottom when messages change (delay so long bot replies are laid out first)
  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 80);
    return () => clearTimeout(t);
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-clear chat every 5 minutes
  useEffect(() => {
    const resetChat = () => {
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your AI assistant for the Online Learning Platform. How can I help you today?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    };

    const interval = setInterval(resetChat, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Chatbot is always visible, no visibility check needed
  if (loading) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Show loading message
    const loadingMsg = {
      id: Date.now() + 1,
      text: 'Thinking...',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      setSending(true);
      const response = await api.post('/ai/ask', {
        question: userMessage
      });

      const raw = response.data?.response;
      if (raw == null || String(raw).trim() === '') {
        throw new Error('Invalid response');
      }
      const responseText = typeof raw === 'string' ? raw : String(raw);

      // Remove loading message and add full bot response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, {
          id: Date.now() + 2,
          text: responseText,
          sender: 'bot',
          timestamp: new Date()
        }];
      });
    } catch (err) {
      console.error('[ChatbotWidget] Error sending message:', err);
      // Keep conversation; replace loading with an error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, {
          id: Date.now() + 2,
          text: 'Sorry, I couldn\'t load an answer. Please check your connection and try again.',
          sender: 'bot',
          timestamp: new Date()
        }];
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3 className="chatbot-title">AI Assistant</h3>
            <button 
              className="chatbot-close"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          
          <div className="chatbot-body">
            <div className="chatbot-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chatbot-message ${
                    message.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'
                  }`}
                >
                  <div className={`message-content ${message.isLoading ? 'message-loading' : ''}`}>
                    {message.isLoading ? (
                      <span className="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="chatbot-footer">
            <form onSubmit={handleSendMessage} className="chatbot-form">
              <input
                ref={inputRef}
                type="text"
                className="chatbot-input"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={sending}
              />
              <button 
                type="submit"
                className="chatbot-send"
                aria-label="Send message"
                disabled={sending || !inputMessage.trim()}
              >
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className="chatbot-button"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default ChatbotWidget;

