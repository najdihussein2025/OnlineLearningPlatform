import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, showLabel = true, size = 'medium' }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`progress-bar-wrapper progress-bar-${size}`}>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
      {showLabel && (
        <span className="progress-bar-label">{clampedProgress}% Complete</span>
      )}
    </div>
  );
};

export default ProgressBar;

