import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/admin/DataTable/DataTable';
import './ActivityLog.css';

const ActivityLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInInterval);
      if (interval >= 1) {
        return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
      }
    }
    return 'just now';
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auditlogs?limit=500');
      const logs = response.data || [];
      
      const activities = logs.map(log => ({
        id: `audit-${log.id}`,
        type: log.entityType.toLowerCase(),
        action: log.action,
        entityType: log.entityType,
        entityName: log.entityName,
        description: log.description,
        user: log.userName || 'System',
        time: getTimeAgo(new Date(log.createdAt)),
        createdAt: new Date(log.createdAt),
        fullDescription: log.description
      }));

      setActivityData(activities);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivity = activityData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === '' || item.entityType === filterType;
    const matchesAction = filterAction === '' || item.action === filterAction;
    
    return matchesSearch && matchesType && matchesAction;
  });

  const activityColumns = [
    { key: 'action', header: 'Action' },
    { key: 'entityType', header: 'Entity Type' },
    { key: 'entityName', header: 'Entity Name' },
    { key: 'description', header: 'Description' },
    { key: 'user', header: 'User' },
    { key: 'time', header: 'Time', align: 'right' },
  ];

  const uniqueEntityTypes = [...new Set(activityData.map(a => a.entityType))];
  const uniqueActions = [...new Set(activityData.map(a => a.action))];

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">View all platform activities and changes</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by activity, user, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Entity Types</option>
            {uniqueEntityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-select"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <button 
            onClick={() => {
              setSearchQuery('');
              setFilterType('');
              setFilterAction('');
            }}
            className="btn-reset"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="activity-stats">
        <div className="stat-box">
          <span className="stat-label">Total Activities:</span>
          <span className="stat-value">{activityData.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Filtered Results:</span>
          <span className="stat-value">{filteredActivity.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading activity logs...</p>
        </div>
      ) : (
        <div className="activity-table-container">
          <DataTable
            columns={activityColumns}
            data={filteredActivity}
            emptyMessage="No activities found matching your filters"
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
