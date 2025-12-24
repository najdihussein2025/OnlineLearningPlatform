import React from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay" onClick={onClose}>
      <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-dialog-header">
          <h3 className="confirmation-dialog-title">{title}</h3>
          <button className="confirmation-dialog-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="confirmation-dialog-body">
          <p className="confirmation-dialog-message">{message}</p>
        </div>
        <div className="confirmation-dialog-actions">
          <button className="btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`btn-primary btn-${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

