import React from 'react';
import { ClipboardList, AlertCircle } from 'lucide-react';

/**
 * Inspection Table Component
 * Displays inspection logs if provided by backend API.
 */
export const InspectionTable = ({ inspections = [] }) => {
  if (!inspections || inspections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-semibold text-gray-800">No Inspection Records Available</h3>
        <p className="text-xs text-gray-500 mt-1">
          Quality inspection logging endpoints are not configured on the current backend service.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Quality Inspections</h3>
        <span className="text-xs text-gray-500">Source: Backend Quality Records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="p-3">Inspection ID</th>
              <th className="p-3">Manufacturing Order</th>
              <th className="p-3">Product</th>
              <th className="p-3">Status</th>
              <th className="p-3">Result</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inspections.map((item, idx) => (
              <tr key={item.id || item._id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-mono text-xs font-medium text-gray-900">{item.inspectionId || item.id || `INSP-${idx + 1}`}</td>
                <td className="p-3">{item.moNumber || item.manufacturingOrder?.moNumber || '-'}</td>
                <td className="p-3">{item.productName || item.product?.name || '-'}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {item.status || 'Pending'}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      item.result === 'Pass' || item.result === 'passed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.result === 'Fail' || item.result === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.result || 'Pending'}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-500">
                  {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionTable;
