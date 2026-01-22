import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './chatbot.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch chatbot visibility from API
  useEffect(() => {
    const loadChatbotVisibility = async () => {
      try {
        const response = await api.get('/settings/chatbot-visibility');
        const isEnabled = response.data?.isEnabled === true;
        console.log('[ChatbotWidget] Visibility loaded:', isEnabled);
        setChatbotEnabled(isEnabled);
      } catch (err) {
        console.error('[ChatbotWidget] Error loading chatbot visibility:', err);
        // Default to false on error - hide chatbot if API fails
        setChatbotEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    loadChatbotVisibility();

    // Poll for updates every 5 seconds to reflect settings changes
    const interval = setInterval(loadChatbotVisibility, 5000);

    return () => clearInterval(interval);
  }, []);

  // If chatbot is disabled or still loading, render nothing
  if (loading || !chatbotEnabled) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    // Placeholder for send functionality
    // Later will be implemented with API calls
    console.log('Send message clicked');
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
              <div className="chatbot-message chatbot-message-bot">
                <div className="message-content">
                  Hello! I'm your AI assistant. How can I help you today?
                </div>
              </div>
            </div>
          </div>
          
          <div className="chatbot-footer">
            <form onSubmit={handleSendMessage} className="chatbot-form">
              <input
                type="text"
                className="chatbot-input"
                placeholder="Type your message..."
                autoFocus
              />
              <button 
                type="submit"
                className="chatbot-send"
                aria-label="Send message"
              >
                Send
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

