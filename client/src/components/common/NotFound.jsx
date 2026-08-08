import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard } from 'lucide-react';

/**
 * NotFound Component
 * 404 Fallback page for unmatched routes.
 */
export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Error 404
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Page Not Found</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            The requested module route does not exist or has been relocated within the
            manufacturing portal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
