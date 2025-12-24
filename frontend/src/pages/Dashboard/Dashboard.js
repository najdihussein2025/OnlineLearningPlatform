import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="dashboard-content">
          <section className="dashboard-section">
            <h2>My Courses</h2>
            <p>Your enrolled courses will appear here.</p>
          </section>
          <section className="dashboard-section">
            <h2>Progress</h2>
            <p>Track your learning progress here.</p>
          </section>
          <section className="dashboard-section">
            <h2>Certificates</h2>
            <p>View your earned certificates here.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

