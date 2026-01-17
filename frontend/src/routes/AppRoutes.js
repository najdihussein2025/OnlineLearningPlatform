import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import Courses from '../pages/Courses/Courses';
import Contact from '../pages/Contact/Contact';
import Services from '../pages/Services/Services';
import About from '../pages/About/About';
import StudentDashboard from '../pages/Student/Dashboard/StudentDashboard';
import StudentCourses from '../pages/Student/Courses/StudentCourses';
import StudentCourseDetails from '../pages/Student/Courses/StudentCourseDetails';
import StudentLessons from '../pages/Student/Lessons/StudentLessons';
import StudentQuizzes from '../pages/Student/Quizzes/StudentQuizzes';
import TakeQuiz from '../pages/Student/Quizzes/TakeQuiz';
import StudentProgress from '../pages/Student/Progress/StudentProgress';
import StudentCertificates from '../pages/Student/Certificates/StudentCertificates';
import StudentSettings from '../pages/Student/Settings/StudentSettings';
import InstructorLayout from '../layouts/InstructorLayout';
import InstructorDashboard from '../pages/Instructor/Dashboard/InstructorDashboard';
import InstructorCourses from '../pages/Instructor/Courses/InstructorCourses';
import NewCourse from '../pages/Instructor/Courses/NewCourse';
import InstructorLessons from '../pages/Instructor/Lessons/InstructorLessons';
import NewLesson from '../pages/Instructor/Lessons/NewLesson';
import EditLesson from '../pages/Instructor/Lessons/EditLesson';
import InstructorQuizzes from '../pages/Instructor/Quizzes/InstructorQuizzes';
import NewQuiz from '../pages/Instructor/Quizzes/NewQuiz';
import EditQuiz from '../pages/Instructor/Quizzes/EditQuiz';
import InstructorStudents from '../pages/Instructor/Students/InstructorStudents';
import EditStudent from '../pages/Instructor/Students/EditStudent';
import InstructorAnalytics from '../pages/Instructor/Analytics/InstructorAnalytics';
import InstructorSettings from '../pages/Instructor/Settings/InstructorSettings';
import AdminDashboard from '../pages/Admin/Dashboard/AdminDashboard';
import AdminUsers from '../pages/Admin/Users/AdminUsers';
import AdminCourses from '../pages/Admin/Courses/AdminCourses';
import AdminLessons from '../pages/Admin/Lessons/AdminLessons';
import AdminQuizzes from '../pages/Admin/Quizzes/AdminQuizzes';
import AdminCertificates from '../pages/Admin/Certificates/AdminCertificates';
import AdminAnalytics from '../pages/Admin/Analytics/AdminAnalytics';
import AdminSettings from '../pages/Admin/Settings/AdminSettings';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/course/:id" element={<Courses />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Role-based Dashboard Routes */}
      </Route>

      {/* Student Routes with StudentLayout */}
      <Route
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses" element={<StudentCourses />} />
        <Route path="/student/courses/:courseId" element={<StudentCourseDetails />} />
        <Route path="/student/lessons" element={<StudentLessons />} />
        <Route path="/student/quizzes" element={<StudentQuizzes />} />
        <Route path="/student/quizzes/:quizId" element={<TakeQuiz />} />
        <Route path="/student/progress" element={<StudentProgress />} />
        <Route path="/student/certificates" element={<StudentCertificates />} />
        <Route path="/student/settings" element={<StudentSettings />} />
      </Route>

      {/* Instructor Routes with InstructorLayout */}
      <Route
        element={
          <ProtectedRoute requiredRole="instructor">
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        <Route path="/instructor/courses" element={<InstructorCourses />} />
        <Route path="/instructor/courses/new" element={<NewCourse />} />
        <Route path="/instructor/lessons" element={<InstructorLessons />} />
        <Route path="/instructor/lessons/new" element={<NewLesson />} />
        <Route path="/instructor/lessons/:id/edit" element={<EditLesson />} />
        <Route path="/instructor/quizzes" element={<InstructorQuizzes />} />
        <Route path="/instructor/quizzes/new" element={<NewQuiz />} />
        <Route path="/instructor/quizzes/:id/edit" element={<EditQuiz />} />
        <Route path="/instructor/students" element={<InstructorStudents />} />
        <Route path="/instructor/students/course/:courseId" element={<EditStudent />} />
        <Route path="/instructor/students/:id" element={<EditStudent />} />
        <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
        <Route path="/instructor/settings" element={<InstructorSettings />} />
      </Route>

      {/* Admin Routes with AdminLayout */}
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/lessons" element={<AdminLessons />} />
        <Route path="/admin/quizzes" element={<AdminQuizzes />} />
        <Route path="/admin/certificates" element={<AdminCertificates />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;

