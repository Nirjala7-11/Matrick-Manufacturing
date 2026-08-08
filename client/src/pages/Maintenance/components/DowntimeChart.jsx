import React from 'react';
import { BarChart2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * Machine Downtime Chart Component
 * Displays downtime metrics solely provided by backend API.
 */
export const DowntimeChart = ({ downtimeData = null }) => {
  if (!downtimeData || !Array.isArray(downtimeData) || downtimeData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <BarChart2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-semibold text-gray-800">Downtime Analytics Unavailable</h3>
        <p className="text-xs text-gray-500 mt-1">
          Backend machine downtime tracking data source is currently unpopulated.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Work Center Downtime (Hours)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={downtimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="workCenter" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar dataKey="downtimeHours" fill="#ef4444" radius={[4, 4, 0, 0]} name="Downtime (Hours)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DowntimeChart;
