import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, change, changeType, icon, color = 'primary' }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon">
          {icon}
        </div>
        <div className="stat-card-content">
          <h3 className="stat-card-title">{title}</h3>
          <div className="stat-card-value">{value}</div>
          {change && (
            <div className={`stat-card-change stat-card-change-${changeType || 'positive'}`}>
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

