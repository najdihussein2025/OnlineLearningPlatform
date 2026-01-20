import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">Online Learning Platform</Link>
        </div>
        <button 
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
        <ul className={`navbar-menu ${mobileMenuOpen ? 'navbar-menu-open' : ''}`}>
          <li className="navbar-item">
            <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/courses" className={`navbar-link ${isActive('/courses') ? 'active' : ''}`}>
              Courses
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/services" className={`navbar-link ${isActive('/services') ? 'active' : ''}`}>
              Services
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/about" className={`navbar-link ${isActive('/about') ? 'active' : ''}`}>
              About Us
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/contact" className={`navbar-link ${isActive('/contact') ? 'active' : ''}`}>
              Contact Us
            </Link>
          </li>
        </ul>
        <div className={`navbar-actions ${mobileMenuOpen ? 'navbar-actions-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to={
                  role === 'student' ? '/student/dashboard' :
                  role === 'instructor' ? '/instructor/dashboard' :
                  role === 'admin' ? '/admin/dashboard' : '/dashboard'
                } 
                className="navbar-link"
              >
                Dashboard
              </Link>
              {role === 'admin' && (
                <Link 
                  to="/admin/activity-log" 
                  className="navbar-link"
                >
                  Activity Log
                </Link>
              )}
              <span className="navbar-user">Welcome, {user?.firstName || user?.email}</span>
              <button onClick={handleLogout} className="btn-navbar btn-navbar-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-navbar btn-navbar-outline">
                Login
              </Link>
              <Link to="/register" className="btn-navbar btn-navbar-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

