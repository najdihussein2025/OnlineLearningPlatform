import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);
  const selectedCourseIdRef = useRef(null);
  const selectedInstructorIdRef = useRef(null);
  const userIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const contactsRes = await api.get('/chat/contacts');
        setContacts(contactsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('Failed to load contacts');
        setLoading(false);
      }
    };

    loadContacts();
  }, [user]);

  // Update refs when values change
  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
    selectedInstructorIdRef.current = selectedInstructorId;
    userIdRef.current = user?.id;
  }, [selectedCourseId, selectedInstructorId, user]);

  // Initialize SignalR connection
  useEffect(() => {
    const initializeConnection = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');
        const hubConnection = new signalR.HubConnectionBuilder()
          .withUrl(`http://localhost:5000/chatHub?access_token=${token}`, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();

        connectionRef.current = hubConnection;

        // Set up ReceiveMessage listener - uses refs to always have current values
        hubConnection.on('ReceiveMessage', (messageData) => {
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === messageData.id);
            if (exists) return prev;

            // Get current values from refs
            const currentCourseId = selectedCourseIdRef.current;
            const currentInstructorId = selectedInstructorIdRef.current;
            const currentUserId = userIdRef.current;

            // Only add message if it's for the currently selected contact
            // Message should be between current user and selected contact
            const isForCurrentChat = 
              messageData.courseId === currentCourseId &&
              ((messageData.senderId === currentUserId && messageData.receiverId === currentInstructorId) ||
               (messageData.receiverId === currentUserId && messageData.senderId === currentInstructorId));

            if (isForCurrentChat) {
              return [...prev, messageData];
            }
            return prev;
          });
        });

        hubConnection.onreconnecting(() => {
          setConnected(false);
        });

        hubConnection.onreconnected(() => {
          setConnected(true);
          // Rejoin the course room if we have a selected contact
          const currentCourseId = selectedCourseIdRef.current;
          if (currentCourseId) {
            hubConnection.invoke('JoinCourseRoom', parseInt(currentCourseId));
          }
        });

        // Start connection
        await hubConnection.start();
        setConnected(true);
        setConnection(hubConnection);
      } catch (err) {
        console.error('Error initializing SignalR connection:', err);
        setError('Failed to connect to chat server');
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [user]);

  // Handle contact selection
  const handleContactClick = async (contact) => {
    if (!connection || !connected) {
      setError('Not connected to chat server');
      return;
    }

    try {
      setSelectedContact(contact);
      const courseId = contact.courseId;
      const instructorId = contact.instructorId || contact.studentId; // Handle both student and instructor views
      
      setSelectedCourseId(courseId);
      setSelectedInstructorId(instructorId);
      setMessages([]);
      setError(null);

      // Join the course room
      await connection.invoke('JoinCourseRoom', parseInt(courseId));

      // Load previous messages
      const messagesRes = await api.get(`/chat/messages/${courseId}/${instructorId}`);
      setMessages(messagesRes.data || []);
    } catch (err) {
      console.error('Error selecting contact:', err);
      setError('Failed to load chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection || !selectedContact || !selectedCourseId || !selectedInstructorId || !user) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Call SignalR hub method with: courseId, senderId, receiverId, message
      await connection.invoke('SendMessage', 
        parseInt(selectedCourseId),
        parseInt(user.id),
        parseInt(selectedInstructorId),
        messageText
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      // Restore the message text if sending failed
      setNewMessage(messageText);
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Left Sidebar - Contacts */}
      <div className="chat-contacts-sidebar">
        <div className="chat-contacts-header">
          <h2>Chat</h2>
          <div className="chat-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="chat-contacts-list">
          {contacts.length === 0 ? (
            <div className="no-contacts">
              <p>No contacts available</p>
            </div>
          ) : (
            contacts.map((contact) => {
              const isSelected = selectedContact?.courseId === contact.courseId && 
                                selectedContact?.instructorId === contact.instructorId;
              const contactName = contact.instructorName || contact.studentName;
              return (
                <div
                  key={`${contact.courseId}-${contact.instructorId || contact.studentId}`}
                  className={`chat-contact-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="contact-avatar">
                    {contactName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{contactName}</div>
                    <div className="contact-course">{contact.courseTitle}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Side - Chat Messages */}
      <div className="chat-messages-panel">
        {!selectedContact ? (
          <div className="chat-empty-state">
            <p>Select a contact to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {(selectedContact.instructorName || selectedContact.studentName)?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h3>{selectedContact.instructorName || selectedContact.studentName}</h3>
                  <p className="chat-header-course">{selectedContact.courseTitle}</p>
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
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">
                          {new Date(msg.sentAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
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
                disabled={!connected || !selectedContact}
              />
              <button
                type="submit"
                className="chat-send-button"
                disabled={!newMessage.trim() || !connected || !selectedContact}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
