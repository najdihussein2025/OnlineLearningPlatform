import React from 'react';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import './StudentCertificates.css';

const StudentCertificates = () => {
  const { info, success } = useDashboardToast();
  // Mock data - would come from API
  const certificates = [
    {
      id: 1,
      course: 'UI/UX Design Fundamentals',
      issueDate: '2024-01-15',
      verificationCode: 'CERT-2024-001-UIUX',
      instructor: 'Mike Davis',
      completionDate: '2024-01-15',
    },
    {
      id: 2,
      course: 'Machine Learning Basics',
      issueDate: '2024-01-10',
      verificationCode: 'CERT-2024-002-ML',
      instructor: 'Lisa Anderson',
      completionDate: '2024-01-10',
    },
    {
      id: 3,
      course: 'Complete Web Development Bootcamp',
      issueDate: '2024-01-05',
      verificationCode: 'CERT-2024-003-WEB',
      instructor: 'John Smith',
      completionDate: '2024-01-05',
    },
  ];

  const handleDownload = (certificateId) => {
    // UI only - would trigger PDF download in production
    info('Download feature coming soon');
  };

  return (
    <div className="student-certificates-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Certificates</h1>
          <p className="page-subtitle">View and download your earned certificates</p>
        </div>
      </div>

      {certificates.length > 0 ? (
        <div className="certificates-grid">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="certificate-card">
              <div className="certificate-header">
                <div className="certificate-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="certificate-badge">Certificate of Completion</span>
              </div>

              <div className="certificate-content">
                <h3 className="certificate-course">{certificate.course}</h3>
                <p className="certificate-instructor">Instructor: {certificate.instructor}</p>
                
                <div className="certificate-details">
                  <div className="certificate-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Issued: {new Date(certificate.issueDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="certificate-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Completed: {new Date(certificate.completionDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>

                <div className="certificate-verification">
                  <label className="verification-label">Verification Code</label>
                  <div className="verification-code">
                    <code>{certificate.verificationCode}</code>
                    <button 
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(certificate.verificationCode);
                        success('Verification code copied to clipboard!');
                      }}
                      title="Copy verification code"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="certificate-actions">
                <button 
                  className="btn-download"
                  onClick={() => handleDownload(certificate.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No Certificates Yet</h3>
          <p>Complete courses to earn certificates. Start learning to unlock your first certificate!</p>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;

