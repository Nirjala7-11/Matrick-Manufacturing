import React from 'react';
import { Factory, Loader2 } from 'lucide-react';

/**
 * LoadingScreen Component
 * Professional ERP loader used during initialization, route lazy loading, or auth verification.
 */
export const LoadingScreen = ({ message = 'Loading Manufacturing ERP System...' }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="flex flex-col items-center max-w-sm w-full text-center space-y-4">
        {/* Brand Icon Badge */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
          <Factory className="w-8 h-8 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Matrick Manufacturing
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">{message}</p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
