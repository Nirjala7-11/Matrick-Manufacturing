import React, { useState } from 'react';
import {
  FileText,
  Search,
  Table as TableIcon,
  Layers,
  Inbox,
  AlertCircle,
  Hash,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

/**
 * ReportViewer Component
 * Renders the in-browser interactive data table preview and summary metrics
 * for the currently loaded manufacturing report.
 */
export const ReportViewer = ({
  reportTitle,
  reportDescription,
  columns = [],
  dataRows = [],
  count = 0,
  loading = false,
  error = null,
  appliedFilters = {},
  lastGeneratedTime = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter rows locally by search query
  const filteredRows = dataRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(q)
    );
  });

  // Sort rows locally
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn];
    const valB = b[sortColumn];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleHeaderClick = (key) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  // Status Badge Formatting Helper
  const renderCellContent = (colKey, value) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-300 font-mono">—</span>;
    }

    // Status / Component Status Badges
    if (colKey === 'status' || colKey === 'componentStatus') {
      const statusStr = String(value).toUpperCase();
      let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';

      if (
        statusStr === 'COMPLETED' ||
        statusStr === 'AVAILABLE' ||
        statusStr === 'ACTIVE' ||
        statusStr === 'FINISHED_GOODS_PRODUCTION'
      ) {
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (
        statusStr === 'IN_PROGRESS' ||
        statusStr === 'PARTIAL' ||
        statusStr === 'CONFIRMED'
      ) {
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      } else if (
        statusStr === 'DRAFT' ||
        statusStr === 'PENDING' ||
        statusStr === 'INITIAL_STOCK'
      ) {
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (
        statusStr === 'CANCELLED' ||
        statusStr === 'UNAVAILABLE' ||
        statusStr === 'INACTIVE'
      ) {
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      }

      return (
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${badgeStyle}`}
        >
          {String(value).replace(/_/g, ' ')}
        </span>
      );
    }

    // Quantity / Number formatting
    if (
      colKey === 'quantity' ||
      colKey === 'stockOnHand' ||
      colKey === 'reorderLevel' ||
      colKey === 'previousStock' ||
      colKey === 'newStock' ||
      colKey === 'plannedMins' ||
      colKey === 'actualMins'
    ) {
      const num = Number(value);
      if (!isNaN(num)) {
        return (
          <span className="font-mono font-semibold text-gray-900">
            {num.toLocaleString()}
          </span>
        );
      }
    }

    // Price formatting
    if (colKey === 'costPrice' || colKey === 'salesPrice') {
      const price = Number(value);
      if (!isNaN(price)) {
        return (
          <span className="font-mono text-emerald-700 font-medium">
            ${price.toFixed(2)}
          </span>
        );
      }
    }

    return <span className="text-gray-800">{String(value)}</span>;
  };

  // Calculate Total Quantity summary metric if quantity column exists
  const hasQuantityCol = columns.some(
    (c) =>
      c.key === 'quantity' ||
      c.key === 'stockOnHand' ||
      c.key === 'plannedMins'
  );
  const totalQuantitySum = hasQuantityCol
    ? dataRows.reduce((acc, r) => {
        const val =
          r.quantity ?? r.stockOnHand ?? r.plannedMins ?? 0;
        return acc + (Number(val) || 0);
      }, 0)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Report Viewer Top Header Bar */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">
                {reportTitle || 'Manufacturing Report Preview'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">{reportDescription}</p>
          </div>

          {/* Filter Summary Tags & Timestamp */}
          {lastGeneratedTime && (
            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs self-start md:self-auto">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Generated at{' '}
                <strong className="text-gray-700">
                  {new Date(lastGeneratedTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200/60">
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Total Records
              </span>
              <span className="text-lg font-bold text-gray-900 font-mono">
                {count.toLocaleString()}
              </span>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Hash className="w-4 h-4" />
            </div>
          </div>

          {hasQuantityCol && (
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Volume / Qty
                </span>
                <span className="text-lg font-bold text-emerald-600 font-mono">
                  {totalQuantitySum.toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          )}

          <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Preview Rows Loaded
              </span>
              <span className="text-lg font-bold text-gray-900 font-mono">
                {dataRows.length.toLocaleString()}
              </span>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Search Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in report preview..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          {searchQuery && (
            <span className="text-xs text-gray-500 self-start sm:self-auto">
              Showing {sortedRows.length} of {dataRows.length} matching rows
            </span>
          )}
        </div>
      </div>

      {/* Main Table Content Area */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-700">
            Querying backend data store and compiling report...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Applying filter criteria directly to manufacturing records
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50/50">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-800">
            Report Generation Failure
          </h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-700">
            No Records Found
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No manufacturing data matches your specified filter criteria. Try adjusting date ranges or clearing status filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-gray-100 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-[10px] w-12 text-center">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-[10px] cursor-pointer hover:bg-gray-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50/30 transition-colors duration-100"
                >
                  <td className="px-4 py-2.5 text-center font-mono text-gray-400 text-[11px]">
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                      {renderCellContent(col.key, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info Bar */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          Showing preview table layout ({sortedRows.length} rows)
        </span>
        <span className="font-semibold text-gray-700">
          For full dataset export, use the Excel (.xlsx) or PDF (.pdf) buttons above
        </span>
      </div>
    </div>
  );
};

export default ReportViewer;
