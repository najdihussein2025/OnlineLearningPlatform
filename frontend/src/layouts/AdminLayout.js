import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const { role } = useAuth();

  return (
    <DashboardLayout role={role || 'admin'} showSearch={false}>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;

