import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import SearchBar from '../admin/SearchBar/SearchBar';
import ToastContainer from '../ToastContainer/ToastContainer';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { useToast } from '../../hooks/useToast';
import './DashboardLayout.css';

const DashboardToastContext = createContext(null);

export const useDashboardToast = () => {
  const context = useContext(DashboardToastContext);
  return context || { success: () => {}, error: () => {}, info: () => {} };
};

const DashboardLayout = ({ children, role, showSearch = false, onSearch }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const { toasts, removeToast, success, error, info } = useToast();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      setShowNotifications(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowProfileMenu(false);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <DashboardToastContext.Provider value={{ success, error, info }}>
      <div className="dashboard-layout">
        <Sidebar 
          role={role} 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="dashboard-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {showSearch && (
            <div className="dashboard-header-search">
              <SearchBar 
                placeholder="Search users, courses, quizzes..."
                value={searchQuery}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>
          )}

          <div className="dashboard-header-content">
            {role === 'admin' && (
              <button 
                className="dashboard-notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="notification-badge">3</span>
              </button>
            )}
            
            <div className="dashboard-profile-menu" ref={profileMenuRef}>
              <button 
                className="dashboard-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="dashboard-user-avatar">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="dashboard-user-info">
                  <span className="dashboard-user-name">
                    {user?.firstName || user?.email || 'User'}
                  </span>
                  <span className="dashboard-user-role">{role}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {showProfileMenu && (
                <div className="dashboard-profile-dropdown">
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      if (role === 'admin') {
                        navigate('/admin/settings');
                      }
                      setShowProfileMenu(false);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Profile Settings
                  </button>
                  <button 
                    className="dropdown-item" 
                    onClick={handleLogoutClick}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-content">
          {children}
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />
    </div>
    </DashboardToastContext.Provider>
  );
};

export default DashboardLayout;

