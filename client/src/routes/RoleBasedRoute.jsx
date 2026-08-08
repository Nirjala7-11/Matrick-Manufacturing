import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasRole, ROLE_LABELS } from '../config/roles';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * RoleBasedRoute Component
 * Restricts access to specific user roles on the frontend for enhanced UX.
 */
export const RoleBasedRoute = ({
  userRole,
  allowedRoles = [],
  children,
  fallbackToDashboard = false,
}) => {
  const isAuthorized = hasRole(userRole, allowedRoles);

  if (!isAuthorized) {
    if (fallbackToDashboard) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 space-y-4">
          <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your role (
              <span className="font-bold text-slate-700 capitalize">
                {ROLE_LABELS[userRole] || userRole}
              </span>
              ) is not authorized to access this manufacturing module.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default RoleBasedRoute;
