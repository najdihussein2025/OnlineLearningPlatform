import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);
  const selectedConversationIdRef = useRef(null);
  const userIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await api.get('/chat/conversations');
        setConversations(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations');
        setLoading(false);
      }
    };
    loadConversations();
  }, [user]);

  // Refs for SignalR
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
    userIdRef.current = user?.id;
  }, [selectedConversation, user]);

  // SignalR connection
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        const hub = new signalR.HubConnectionBuilder()
          .withUrl(`http://localhost:5000/chatHub?access_token=${token}`, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();

        connectionRef.current = hub;

        hub.on('ReceiveMessage', (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            const convId = selectedConversationIdRef.current;
            if (payload.conversationId !== convId) return prev;
            return [...prev, {
              id: payload.id,
              conversationId: payload.conversationId,
              senderId: payload.senderId,
              senderName: payload.senderName,
              content: payload.content,
              sentAt: payload.sentAt
            }];
          });
        });

        hub.onreconnecting(() => setConnected(false));
        hub.onreconnected(() => {
          setConnected(true);
          const convId = selectedConversationIdRef.current;
          if (convId) hub.invoke('JoinConversationRoom', parseInt(convId));
        });

        await hub.start();
        setConnected(true);
        setConnection(hub);
      } catch (err) {
        console.error('SignalR init error:', err);
        setError('Failed to connect to chat');
      }
    };
    init();
    return () => {
      if (connectionRef.current) connectionRef.current.stop();
    };
  }, [user]);

  const loadAvailablePartners = async () => {
    try {
      const res = await api.get('/chat/conversations/available-partners');
      setAvailablePartners(res.data || []);
      setShowNewChat(true);
    } catch (err) {
      console.error('Error loading partners:', err);
      setError('Failed to load contacts');
    }
  };

  const startConversation = async (otherUserId) => {
    if (!otherUserId || startingChat) return;
    try {
      setStartingChat(true);
      const res = await api.post(`/chat/conversations/with/${otherUserId}`);
      const conv = res.data;
      setConversations(prev => {
        const exists = prev.some(c => c.id === conv.id);
        if (exists) return prev;
        return [{ id: conv.id, otherPartyId: conv.otherPartyId, otherPartyName: conv.otherPartyName, otherPartyEmail: conv.otherPartyEmail }, ...prev];
      });
      setSelectedConversation({ id: conv.id, otherPartyName: conv.otherPartyName, otherPartyEmail: conv.otherPartyEmail });
      setShowNewChat(false);
      setAvailablePartners([]);
      setMessages([]);
      setError(null);
      const convId = conv.id;
      const msgRes = await api.get(`/chat/messages/${convId}`);
      setMessages(msgRes.data || []);
      if (connection && connected) {
        await connection.invoke('JoinConversationRoom', parseInt(convId));
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const handleConversationClick = async (conv) => {
    if (!connection || !connected) {
      setError('Not connected to chat server');
      return;
    }
    try {
      setSelectedConversation(conv);
      setMessages([]);
      setError(null);
      await connection.invoke('JoinConversationRoom', parseInt(conv.id));
      const res = await api.get(`/chat/messages/${conv.id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection || !selectedConversation || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await connection.invoke('SendMessage', parseInt(selectedConversation.id), text);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setNewMessage(text);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-contacts-sidebar">
        <div className="chat-contacts-header">
          <h2>Chat</h2>
          <div className="chat-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="chat-contacts-list">
          {conversations.length === 0 ? (
            <div className="no-contacts">
              <p>No conversations yet.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-contact-item ${selectedConversation?.id === conv.id ? 'selected' : ''}`}
                onClick={() => handleConversationClick(conv)}
              >
                <div className="contact-avatar">
                  {(conv.otherPartyName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <div className="contact-name">{conv.otherPartyName}</div>
                  <div className="contact-course">{conv.otherPartyEmail}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-messages-panel">
        {!selectedConversation ? (
          <div className="chat-empty-state">
            <p>Select a conversation.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {(selectedConversation.otherPartyName || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedConversation.otherPartyName}</h3>
                  <p className="chat-header-course">{selectedConversation.otherPartyEmail}</p>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`message ${isMyMessage ? 'message-sent' : 'message-received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{msg.content}</div>
                        <div className="message-time">
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!connected || !selectedConversation}
              />
              <button
                type="submit"
                className="chat-send-button"
                disabled={!newMessage.trim() || !connected || !selectedConversation}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>

      {showNewChat && (
        <div className="chat-modal-overlay" onClick={() => { setShowNewChat(false); setAvailablePartners([]); }}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Start conversation with</h3>
            <div className="chat-partners-list">
              {availablePartners.length === 0 ? (
                <p>No one else to message. Everyone you can talk to is already in your list.</p>
              ) : (
                availablePartners.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="chat-partner-item"
                    onClick={() => startConversation(p.id)}
                    disabled={startingChat}
                  >
                    <span className="contact-name">{p.fullName}</span>
                    <span className="contact-email">{p.email}</span>
                  </button>
                ))
              )}
            </div>
            <button type="button" className="chat-modal-close" onClick={() => { setShowNewChat(false); setAvailablePartners([]); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
