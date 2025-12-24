import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Learn. Practice. Get Certified.</h1>
            <p className="hero-subtitle">
              A modern online platform where students learn, take quizzes,
              track progress, and earn certificates.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/courses" className="btn btn-secondary">
                Browse Courses
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">
              <svg width="100%" height="100%" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="600" height="400" rx="16" fill="url(#gradient)"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="600" y2="400" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#1e3a8a"/>
                  </linearGradient>
                </defs>
                <circle cx="300" cy="200" r="80" fill="white" opacity="0.2"/>
                <rect x="200" y="150" width="200" height="100" rx="8" fill="white" opacity="0.3"/>
                <text x="300" y="210" textAnchor="middle" fill="white" fontSize="24" fontWeight="600">Dashboard Preview</text>
              </svg>
            </div>
          </div>
        </div>
        <div className="hero-background"></div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Platform Features</h2>
            <p className="section-subtitle">
              Everything you need to learn, practice, and succeed
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Watch Lessons</h3>
              <p className="feature-description">
                Access video lessons and comprehensive articles to learn at your own pace
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Take Interactive Quizzes</h3>
              <p className="feature-description">
                Test your knowledge with engaging quizzes and get instant feedback
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V21L12 18L21 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9L12 12L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Track Your Progress</h3>
              <p className="feature-description">
                Monitor your learning journey with detailed analytics and progress tracking
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Earn Verified Certificates</h3>
              <p className="feature-description">
                Get recognized for your achievements with verified digital certificates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in four simple steps
            </p>
          </div>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">Create an Account</h3>
              <p className="step-description">Sign up in seconds with your email</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 11H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">Enroll in a Course</h3>
              <p className="step-description">Browse and select courses that interest you</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">Learn & Take Quizzes</h3>
              <p className="step-description">Study lessons and test your knowledge</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">Get Certified</h3>
              <p className="step-description">Earn your certificate upon completion</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="for-who">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built for Everyone</h2>
            <p className="section-subtitle">
              Whether you're learning or teaching, we've got you covered
            </p>
          </div>
          <div className="for-who-grid">
            <div className="for-who-card">
              <div className="for-who-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="for-who-title">Students</h3>
              <ul className="for-who-list">
                <li>Learn at your own pace</li>
                <li>Track progress with detailed analytics</li>
                <li>Download verified certificates</li>
                <li>Access courses anytime, anywhere</li>
              </ul>
            </div>
            <div className="for-who-card">
              <div className="for-who-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="for-who-title">Instructors / Admins</h3>
              <ul className="for-who-list">
                <li>Create and manage courses</li>
                <li>Design interactive quizzes</li>
                <li>View comprehensive analytics</li>
                <li>Monitor student progress</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview Section */}
      <section className="platform-preview">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Platform Preview</h2>
            <p className="section-subtitle">
              Experience our powerful learning management system with analytics, progress tracking, and AI-ready infrastructure
            </p>
          </div>
          <div className="preview-grid">
            <div className="preview-card">
              <div className="preview-image">
                <div className="preview-placeholder">
                  <svg width="100%" height="100%" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="250" rx="12" fill="url(#previewGrad1)"/>
                    <defs>
                      <linearGradient id="previewGrad1" x1="0" y1="0" x2="400" y2="250" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#3b82f6"/>
                        <stop offset="100%" stopColor="#1e3a8a"/>
                      </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="360" height="30" rx="4" fill="white" opacity="0.3"/>
                    <rect x="20" y="70" width="200" height="150" rx="4" fill="white" opacity="0.2"/>
                    <rect x="240" y="70" width="140" height="60" rx="4" fill="white" opacity="0.2"/>
                    <rect x="240" y="140" width="140" height="80" rx="4" fill="white" opacity="0.2"/>
                  </svg>
                </div>
              </div>
              <h3 className="preview-title">Student Dashboard</h3>
              <p className="preview-description">Track your courses, progress, and achievements</p>
            </div>
            <div className="preview-card">
              <div className="preview-image">
                <div className="preview-placeholder">
                  <svg width="100%" height="100%" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="250" rx="12" fill="url(#previewGrad2)"/>
                    <defs>
                      <linearGradient id="previewGrad2" x1="0" y1="0" x2="400" y2="250" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#0d9488"/>
                        <stop offset="100%" stopColor="#0f766e"/>
                      </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="360" height="30" rx="4" fill="white" opacity="0.3"/>
                    <rect x="20" y="70" width="360" height="20" rx="4" fill="white" opacity="0.2"/>
                    <rect x="20" y="110" width="360" height="20" rx="4" fill="white" opacity="0.2"/>
                    <rect x="20" y="150" width="360" height="20" rx="4" fill="white" opacity="0.2"/>
                    <circle cx="50" cy="80" r="8" fill="white" opacity="0.4"/>
                    <circle cx="50" cy="120" r="8" fill="white" opacity="0.4"/>
                    <circle cx="50" cy="160" r="8" fill="white" opacity="0.4"/>
                  </svg>
                </div>
              </div>
              <h3 className="preview-title">Quiz Interface</h3>
              <p className="preview-description">Interactive quizzes with instant feedback</p>
            </div>
            <div className="preview-card">
              <div className="preview-image">
                <div className="preview-placeholder">
                  <svg width="100%" height="100%" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="250" rx="12" fill="url(#previewGrad3)"/>
                    <defs>
                      <linearGradient id="previewGrad3" x1="0" y1="0" x2="400" y2="250" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1e3a8a"/>
                        <stop offset="100%" stopColor="#0d9488"/>
                      </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="360" height="30" rx="4" fill="white" opacity="0.3"/>
                    <rect x="20" y="70" width="120" height="150" rx="4" fill="white" opacity="0.2"/>
                    <rect x="160" y="70" width="220" height="70" rx="4" fill="white" opacity="0.2"/>
                    <rect x="160" y="150" width="220" height="70" rx="4" fill="white" opacity="0.2"/>
                  </svg>
                </div>
              </div>
              <h3 className="preview-title">Instructor Dashboard</h3>
              <p className="preview-description">Manage courses and view analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Start Learning Today</h2>
            <p className="cta-subtitle">
              Join students and instructors using our platform to grow skills and advance careers.
            </p>
            <Link to="/register" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
