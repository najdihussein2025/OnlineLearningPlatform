import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => {
  const { role } = useAuth();

  return (
    <DashboardLayout role={role || 'student'} showSearch={false}>
      <Outlet />
    </DashboardLayout>
  );
};

export default StudentLayout;

