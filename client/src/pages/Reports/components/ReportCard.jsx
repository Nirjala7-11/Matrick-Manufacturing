import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  Boxes,
  Factory,
  Layers,
  CheckCircle2,
} from 'lucide-react';

/**
 * ReportCard Component
 * Renders an enterprise report selection card detailing title, category, description,
 * supported export formats (Excel & PDF), and visual selection state.
 */
export const ReportCard = ({ report, isSelected, onSelect }) => {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'manufacturing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'production':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inventory':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getReportIcon = (id) => {
    switch (id) {
      case 'manufacturing-orders':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'throughput':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'work-orders':
        return <Factory className="w-5 h-5 text-purple-600" />;
      case 'stock-ledger':
        return <Layers className="w-5 h-5 text-amber-600" />;
      case 'product-stock':
        return <Boxes className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(report.id)}
      className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xs">
              {getReportIcon(report.id)}
            </div>
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadge(
                  report.category
                )}`}
              >
                {report.categoryName}
              </span>
            </div>
          </div>

          {isSelected && (
            <div className="text-blue-600">
              <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
            </div>
          )}
        </div>

        {/* Report Title & Description */}
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {report.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {report.description}
        </p>
      </div>

      {/* Footer Supported Formats Pill Bar */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Export Formats:
        </span>
        <div className="flex items-center gap-1.5">
          {report.formats.includes('excel') && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
              title="Excel (.xlsx) Export Supported"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>Excel</span>
            </span>
          )}

          {report.formats.includes('pdf') && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200"
              title="PDF (.pdf) Document Export Supported"
            >
              <FileText className="w-3 h-3 text-rose-600" />
              <span>PDF</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
