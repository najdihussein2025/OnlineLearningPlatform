import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './ChatPage.css';

const ChatPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [otherParty, setOtherParty] = useState(null);
  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!courseId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Verify access and get course info
        const verifyRes = await api.get(`/chat/verify/${courseId}`);
        const verifyData = verifyRes.data;

        if (!verifyData.hasAccess) {
          setError('You do not have access to this course chat');
          setLoading(false);
          return;
        }

        setCourseInfo({
          title: verifyData.courseTitle,
          role: verifyData.role
        });

        // Set other party
        if (verifyData.role === 'student') {
          setOtherParty({
            id: verifyData.otherPartyId,
            name: verifyData.otherPartyName
          });
        } else {
          // For instructor, we'll use the first enrolled student or allow selection
          if (verifyData.enrolledStudents && verifyData.enrolledStudents.length > 0) {
            setOtherParty(verifyData.enrolledStudents[0]);
          }
        }

        // Load old messages
        const messagesRes = await api.get(`/chat/messages/${courseId}`);
        setMessages(messagesRes.data || []);

        // Connect to SignalR
        const token = localStorage.getItem('token');
        const hubConnection = new signalR.HubConnectionBuilder()
          .withUrl(`http://localhost:5000/chatHub?access_token=${token}`, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();

        connectionRef.current = hubConnection;

        // Set up event handlers
        hubConnection.on('ReceiveMessage', (messageData) => {
          setMessages(prev => [...prev, messageData]);
        });

        hubConnection.on('UserJoined', (userId) => {
          console.log('User joined:', userId);
        });

        hubConnection.onreconnecting(() => {
          setConnected(false);
        });

        hubConnection.onreconnected(() => {
          setConnected(true);
          // Rejoin the course room
          if (courseId) {
            hubConnection.invoke('JoinCourseRoom', parseInt(courseId));
          }
        });

        // Start connection
        await hubConnection.start();
        setConnected(true);

        // Join the course room
        await hubConnection.invoke('JoinCourseRoom', parseInt(courseId));

        setConnection(hubConnection);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(err.response?.data?.message || 'Failed to initialize chat');
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [courseId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection || !otherParty) return;

    try {
      const messageText = newMessage.trim();
      setNewMessage('');

      await connection.invoke('SendMessage', 
        parseInt(courseId), 
        otherParty.id, 
        messageText
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !courseInfo) {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>{courseInfo?.title || 'Course Chat'}</h2>
        <div className="chat-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {otherParty && (
        <div className="chat-other-party">
          <p>Chatting with: <strong>{otherParty.name}</strong></p>
        </div>
      )}

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
          disabled={!connected || !otherParty}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!newMessage.trim() || !connected || !otherParty}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;

