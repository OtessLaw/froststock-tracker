import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Loading spinner for auth check
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-brand flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 spinner border-4"></div>
      <p className="text-navy-600 font-medium">Loading...</p>
    </div>
  </div>
);

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export const PublicRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
};
