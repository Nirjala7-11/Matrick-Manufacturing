import React from 'react';
import { Wrench, FileX } from 'lucide-react';

/**
 * Maintenance Requests & Machine Status Table Component
 */
export const MaintenanceTable = ({ requests = [] }) => {
  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <FileX className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-semibold text-gray-800">No Maintenance Records Available</h3>
        <p className="text-xs text-gray-500 mt-1">
          Maintenance ticket tracking and preventive scheduling endpoints are not configured.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Maintenance Tickets & Machinery Status</h3>
        <span className="text-xs text-gray-500">Source: Backend Maintenance Records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Work Center / Machine</th>
              <th className="p-3">Maintenance Type</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((item, idx) => (
              <tr key={item.id || item._id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-mono text-xs font-medium text-gray-900">{item.ticketId || item.id || `TKT-${idx + 1}`}</td>
                <td className="p-3 font-medium text-gray-800">{item.workCenterName || item.workCenter?.name || '-'}</td>
                <td className="p-3 capitalize">{item.type || 'Corrective'}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      item.priority === 'urgent' || item.priority === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.priority || 'Medium'}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {item.status || 'Open'}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceTable;
