import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/common/LoadingScreen';

/**
 * ProtectedRoute Component
 * Restricts access to authenticated users.
 */
export const ProtectedRoute = ({
  isAuthenticated,
  isLoading,
  user,
  children,
}) => {
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verifying authentication credentials..." />;
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
