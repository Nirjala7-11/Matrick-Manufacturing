import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertOctagon, HelpCircle } from 'lucide-react';

/**
 * Quality Metrics Summary Cards
 * Displays metrics provided by backend API, or explicitly renders 'Not Available' status.
 */
export const QualityMetrics = ({ metrics }) => {
  // Check if backend provided quality metrics object
  const isMetricsAvailable = metrics && typeof metrics.totalInspections === 'number';

  if (!isMetricsAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Quality Metrics Unavailable</h4>
            <p className="text-xs text-amber-700">
              The current backend API does not provide active Quality Control data endpoints.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
          Not Provisioned
        </span>
      </div>
    );
  }

  const {
    totalInspections = 0,
    passedInspections = 0,
    failedInspections = 0,
    defectsCount = 0,
  } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Inspections</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalInspections}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Passed</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{passedInspections}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
          <XCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-0.5">{failedInspections}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Defects Logged</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-0.5">{defectsCount}</h3>
        </div>
      </div>
    </div>
  );
};

export default QualityMetrics;
