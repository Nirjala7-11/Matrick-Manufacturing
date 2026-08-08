import React from 'react';
import { AlertCircle, FileX } from 'lucide-react';

/**
 * Defect Analysis Component
 * Displays defect categories, rejection reasons, or defect frequency if supported by backend API.
 */
export const DefectAnalysis = ({ defectData = null }) => {
  if (!defectData || !defectData.categories || defectData.categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <FileX className="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <h4 className="text-sm font-semibold text-gray-800">Defect Analytics Not Available</h4>
        <p className="text-xs text-gray-500 mt-1">
          Backend defect classification & rejection reason endpoints are currently unpopulated.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Defect Classification & Frequency</h3>
      <div className="space-y-3">
        {defectData.categories.map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">{cat.name}</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded">
              {cat.count} occurrence(s)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefectAnalysis;
