import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../../../components/admin/StatCard/StatCard';
import { useDashboardToast } from '../../../components/DashboardLayout/DashboardLayout';
import api from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import './AdminAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminAnalytics = () => {
  const { error } = useDashboardToast();
  const [stats, setStats] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [enrollmentChartData, setEnrollmentChartData] = useState(null);
  const [quizScoreChartData, setQuizScoreChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, usersRes, quizAttemptsRes, coursesRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/users'),
        api.get('/quizattempts'),
        api.get('/courses')
      ]);

      const enrollments = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : enrollmentsRes.data?.data || [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
      const quizAttempts = Array.isArray(quizAttemptsRes.data) ? quizAttemptsRes.data : quizAttemptsRes.data?.data || [];
      const courses = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];

      // Calculate stats
      const totalEnrollments = enrollments.length;
      const activeUsers = users.filter(u => u.status === 'active' || u.status === 'Active').length;
      
      // Calculate average quiz score
      const avgQuizScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, qa) => sum + (qa.score || 0), 0) / quizAttempts.length)
        : 0;

      // Calculate completion rate
      const completedEnrollments = enrollments.filter(e => e.status === 'completed' || e.status === 'Completed').length;
      const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;

      const calculatedStats = [
        {
          title: 'Total Enrollments',
          value: totalEnrollments.toLocaleString(),
          change: '+15%',
          changeType: 'positive',
          color: 'primary',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          title: 'Average Quiz Score',
          value: `${avgQuizScore}%`,
          change: '+3%',
          changeType: 'positive',
          color: 'success',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          title: 'Completion Rate',
          value: `${completionRate}%`,
          change: '+5%',
          changeType: 'positive',
          color: 'secondary',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21L12 18L21 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          title: 'Active Users',
          value: activeUsers.toLocaleString(),
          change: '+8%',
          changeType: 'positive',
          color: 'accent',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
      ];

      // Calculate top courses
      const coursesWithStats = courses.map(course => {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const courseCompletions = courseEnrollments.filter(e => e.status === 'completed' || e.status === 'Completed');
        const completionRate = courseEnrollments.length > 0 
          ? Math.round((courseCompletions.length / courseEnrollments.length) * 100)
          : 0;
        
        return {
          id: course.id,
          title: course.title,
          enrollments: courseEnrollments.length,
          completion: completionRate,
        };
      }).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);

      // Prepare enrollment chart data
      const enrollmentData = {
        labels: coursesWithStats.map(c => c.title),
        datasets: [
          {
            label: 'Enrollments',
            data: coursesWithStats.map(c => c.enrollments),
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(13, 148, 136, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(13, 148, 136)',
              'rgb(249, 115, 22)',
              'rgb(139, 92, 246)',
              'rgb(236, 72, 153)',
            ],
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        ]
      };

      // Prepare quiz score trend data
      const quizByTime = {};
      quizAttempts.forEach(qa => {
        const date = qa.createdAt ? new Date(qa.createdAt).toLocaleDateString() : 'Unknown';
        if (!quizByTime[date]) {
          quizByTime[date] = [];
        }
        quizByTime[date].push(qa.score || 0);
      });

      const sortedDates = Object.keys(quizByTime).sort((a, b) => new Date(a) - new Date(b)).slice(-7);
      const avgScoresByDate = sortedDates.map(date => {
        const scores = quizByTime[date];
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });

      const quizScoreData = {
        labels: sortedDates,
        datasets: [
          {
            label: 'Average Score',
            data: avgScoresByDate,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          }
        ]
      };

      setStats(calculatedStats);
      setTopCourses(coursesWithStats);
      setEnrollmentChartData(enrollmentData);
      setQuizScoreChartData(quizScoreData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return (
    <div className="admin-analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics & Reports</h1>
        <p className="page-subtitle">Platform performance and insights</p>
      </div>

      {loading ? (
        <div className="loading-message">Loading analytics...</div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

        <div className="analytics-charts">
          <div className="chart-card">
            <h2 className="section-title">Course Enrollments</h2>
            <div className="chart-container">
              {enrollmentChartData ? (
                <Bar
                  data={enrollmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        labels: { font: { size: 14 }, color: '#64748b' }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        ticks: { color: '#64748b', font: { size: 12 } }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 12 } }
                      }
                    }
                  }}
                  height={300}
                />
              ) : (
                <div className="chart-loading">Loading enrollment data...</div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h2 className="section-title">Quiz Average Scores</h2>
            <div className="chart-container">
              {quizScoreChartData ? (
                <Line
                  data={quizScoreChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        labels: { font: { size: 14 }, color: '#64748b' }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        ticks: { color: '#64748b', font: { size: 12 } }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 12 } }
                      }
                    }
                  }}
                  height={300}
                />
              ) : (
                <div className="chart-loading">Loading quiz score data...</div>
              )}
            </div>
          </div>
        </div>

        <div className="top-courses-section">
          <h2 className="section-title">Top Courses</h2>
          <div className="top-courses-list">
            {topCourses.map((course) => (
              <div key={course.id} className="top-course-card">
                <div className="course-rank">#{course.id}</div>
                <div className="course-details">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-stats">
                    <span className="stat-item">📚 {course.enrollments} enrollments</span>
                    <span className="stat-item">✓ {course.completion}% completion</span>
                  </div>
                </div>
                <div className="course-progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${course.completion}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;

