import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        subject: '',
        message: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1000);
  };

  return (
    <div className="contact-page">
      {/* Page Header */}
      <section className="contact-header">
        <div className="container">
          <div className="contact-header-content">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-subtitle">
              Have questions? We're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-layout">
            {/* Left Column - Contact Info */}
            <div className="contact-info-section">
              <h2 className="contact-info-title">Get in Touch</h2>
              <p className="contact-info-description">
                Reach out to us through any of the following channels. We typically respond within 24 hours.
              </p>
              
              <div className="contact-info-cards">
                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="L22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3 className="contact-info-card-title">Email</h3>
                    <p className="contact-info-card-description">
                      <a href="mailto:support@onlinelearning.com">support@onlinelearning.com</a>
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C9.4 21 0 11.6 0 0.08C0 -0.52 0.48 -1 1.08 -1H4.08C4.68 -1 5.16 -0.52 5.16 0.08V3.08C5.16 3.68 4.68 4.16 4.08 4.16H2.08C2.08 8.28 5.72 11.92 9.84 11.92H11.84C12.44 11.92 12.92 12.4 12.92 13V16C12.92 16.6 13.4 17 14 17H17C17.6 17 18.08 17.48 18.08 18.08V21.08C18.08 21.68 18.56 22.16 19.16 22.16H22.16C22.76 22.16 23.24 21.68 23.24 21.08V18.08C23.24 17.48 22.76 17 22.16 17H19.16C18.56 17 18.08 16.52 18.08 15.92V12.92C18.08 12.32 17.6 11.84 17 11.84H14C13.4 11.84 12.92 11.36 12.92 10.76V7.76C12.92 7.16 13.4 6.68 14 6.68H17C17.6 6.68 18.08 7.16 18.08 7.76V10.76C18.08 11.36 18.56 11.84 19.16 11.84H22.16C22.76 11.84 23.24 12.32 23.24 12.92V15.92Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3 className="contact-info-card-title">Phone</h3>
                    <p className="contact-info-card-description">
                      <a href="tel:+96112345678">+961 XX XXX XXX</a>
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3 className="contact-info-card-title">Office Hours</h3>
                    <p className="contact-info-card-description">
                      Mon – Fri, 9AM – 5PM
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3 className="contact-info-card-title">Location</h3>
                    <p className="contact-info-card-description">
                      Online Platform / Remote
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="contact-form-section">
              <h2 className="contact-form-title">Send us a Message</h2>
              <p className="contact-form-description">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {submitSuccess && (
                <div className="form-success-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Thank you! Your message has been sent successfully.</span>
                </div>
              )}

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <span className="error-message">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="required">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`form-select ${errors.subject ? 'input-error' : ''}`}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="courses">Courses</option>
                    <option value="certificates">Certificates</option>
                  </select>
                  {errors.subject && (
                    <span className="error-message">{errors.subject}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message <span className="required">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    className={`form-textarea ${errors.message ? 'input-error' : ''}`}
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && (
                    <span className="error-message">{errors.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large form-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map / Visual Section */}
      <section className="contact-map-section">
        <div className="container">
          <div className="map-placeholder">
            <svg width="100%" height="100%" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="800" height="400" fill="url(#mapGradient)"/>
              <defs>
                <linearGradient id="mapGradient" x1="0" y1="0" x2="800" y2="400" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f1f5f9"/>
                  <stop offset="100%" stopColor="#e2e8f0"/>
                </linearGradient>
              </defs>
              <circle cx="400" cy="200" r="60" fill="white" opacity="0.8" stroke="#1e3a8a" strokeWidth="3"/>
              <path d="M400 140L420 200L400 220L380 200Z" fill="#1e3a8a"/>
              <text x="400" y="280" textAnchor="middle" fill="#475569" fontSize="18" fontWeight="600">Online Platform</text>
              <text x="400" y="300" textAnchor="middle" fill="#64748b" fontSize="14">Available Worldwide</text>
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="contact-faq">
        <div className="container">
          <div className="faq-content">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Quick answers to common questions. Can't find what you're looking for? Contact us above.
            </p>
            <div className="faq-links">
              <Link to="/faq#courses" className="faq-link">
                <div className="faq-link-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="faq-link-content">
                  <h3 className="faq-link-title">How do courses work?</h3>
                  <p className="faq-link-description">Learn about our course structure and learning process</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="faq-link-arrow">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link to="/faq#certificates" className="faq-link">
                <div className="faq-link-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="faq-link-content">
                  <h3 className="faq-link-title">How do certificates work?</h3>
                  <p className="faq-link-description">Understand how to earn and download certificates</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="faq-link-arrow">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link to="/faq#quizzes" className="faq-link">
                <div className="faq-link-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="faq-link-content">
                  <h3 className="faq-link-title">How do quizzes work?</h3>
                  <p className="faq-link-description">Learn about taking quizzes and tracking your progress</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="faq-link-arrow">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

