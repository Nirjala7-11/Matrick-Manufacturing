import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Factory, Shield, Cpu, Activity } from 'lucide-react';

/**
 * AuthLayout Component
 * Public layout container for authentication views (Login, Register, Forgot Password).
 */
export const AuthLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-1 border border-blue-400/20">
            <Factory className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Matrick Manufacturing
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Enterprise Grade Shop Floor, BOM & Inventory Execution Portal
          </p>
        </div>

        {/* Card Body Container */}
        <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8">
          {children || <Outlet />}
        </div>

        {/* Footer Security Badge */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>256-Bit Encrypted Secure JWT Authentication</span>
          </div>
          <p className="text-[10px] text-slate-500">
            &copy; {new Date().getFullYear()} Matrick ERP. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
