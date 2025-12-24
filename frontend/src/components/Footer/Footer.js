import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo & Description Column */}
          <div className="footer-column">
            <h3 className="footer-logo">Online Learning Platform</h3>
            <p className="footer-description">
              A modern online platform where students learn, take quizzes,
              track progress, and earn certificates. Empowering education through technology.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-column">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/courses">Courses</Link>
              </li>
              <li>
                <Link to="/services">Services</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="footer-column">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <Link to="/contact">Help Center</Link>
              </li>
              <li>
                <Link to="/contact">FAQ</Link>
              </li>
              <li>
                <Link to="/contact">Support</Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-column">
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/about">Terms of Service</Link>
              </li>
              <li>
                <Link to="/about">Cookie Policy</Link>
              </li>
              <li>
                <Link to="/about">Accessibility</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Online Learning Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

