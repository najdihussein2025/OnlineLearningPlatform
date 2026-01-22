import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './ChatCourseSelection.css';

const ChatCourseSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        if (user?.role === 'student') {
          // Get enrolled courses
          const enrollmentsRes = await api.get('/enrollments/my');
          const enrollments = enrollmentsRes.data || [];
          const courseIds = enrollments.map(e => e.courseId);
          
          if (courseIds.length === 0) {
            setError('You are not enrolled in any courses');
            setLoading(false);
            return;
          }

          // Get course details
          const coursesData = [];
          for (const courseId of courseIds) {
            try {
              const courseRes = await api.get(`/courses/${courseId}`);
              coursesData.push(courseRes.data);
            } catch (err) {
              console.error(`Error loading course ${courseId}:`, err);
            }
          }
          setCourses(coursesData);
        } else if (user?.role === 'instructor') {
          // Get instructor's courses
          const coursesRes = await api.get('/courses/mine');
          const coursesData = coursesRes.data || [];
          
          if (coursesData.length === 0) {
            setError('You have not created any courses');
            setLoading(false);
            return;
          }

          setCourses(coursesData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses');
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  const handleSelectCourse = (courseId) => {
    const basePath = user?.role === 'student' ? '/student' : '/instructor';
    navigate(`${basePath}/chat/${courseId}`);
  };

  if (loading) {
    return (
      <div className="chat-selection-page">
        <div className="chat-selection-loading">
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-selection-page">
        <div className="chat-selection-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="chat-selection-page">
        <div className="chat-selection-empty">
          <p>No courses available for chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-selection-page">
      <div className="chat-selection-header">
        <h2>Select a Course to Chat</h2>
        <p>Choose a course to start chatting with {user?.role === 'student' ? 'the instructor' : 'your students'}</p>
      </div>
      <div className="chat-selection-grid">
        {courses.map((course) => (
          <div
            key={course.id}
            className="chat-selection-card"
            onClick={() => handleSelectCourse(course.id)}
          >
            <h3>{course.title}</h3>
            <p className="course-description">{course.shortDescription || 'No description'}</p>
            <button className="chat-select-button">Start Chat</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatCourseSelection;

