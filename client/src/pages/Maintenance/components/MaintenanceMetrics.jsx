import React from 'react';
import { Wrench, Activity, Clock, Gauge, HelpCircle } from 'lucide-react';

/**
 * Maintenance & OEE Metrics Component
 * Displays OEE and Machine Status metrics strictly when provided by backend API.
 */
export const MaintenanceMetrics = ({ oeeData = null, maintenanceSummary = null }) => {
  const isOeeAvailable = oeeData && typeof oeeData.oee === 'number';

  return (
    <div className="space-y-4">
      {/* OEE Section */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-base">Overall Equipment Effectiveness (OEE)</h3>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {isOeeAvailable ? 'Source: Backend Engine' : 'Metric Unavailable'}
          </span>
        </div>

        {isOeeAvailable ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-700 font-medium block">Availability</span>
              <span className="text-xl font-bold text-blue-900">{oeeData.availability}%</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <span className="text-xs text-indigo-700 font-medium block">Performance</span>
              <span className="text-xl font-bold text-indigo-900">{oeeData.performance}%</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <span className="text-xs text-emerald-700 font-medium block">Quality</span>
              <span className="text-xl font-bold text-emerald-900">{oeeData.quality}%</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-xs text-purple-700 font-medium block">Overall OEE</span>
              <span className="text-xl font-bold text-purple-900">{oeeData.oee}%</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>OEE calculation engine endpoint is not active on backend service.</span>
            </div>
            <span className="font-medium text-gray-500">Metric unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceMetrics;
