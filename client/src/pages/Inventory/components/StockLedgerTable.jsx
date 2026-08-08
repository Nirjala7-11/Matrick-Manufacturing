import React from 'react';
import StockMovementBadge from './StockMovementBadge';
import { dashboardUtils } from '../../Dashboard/dashboard.utils';
import {
  History,
  Factory,
  Layers,
  User,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';

/**
 * StockLedgerTable
 * Displays chronological stock movement ledger entries from the backend.
 */
export const StockLedgerTable = ({
  entries = [],
  loading = false,
  showProductColumn = true,
  onSelectEntry = null,
}) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
        <p className="text-sm font-medium">Loading Stock Ledger entries...</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        <History className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-800">No stock movements found</p>
        <p className="text-xs text-gray-400 mt-1">
          Stock movements are logged automatically when manufacturing operations consume raw materials, produce finished goods, or when manual adjustments occur.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
            <th className="py-3.5 px-4">Date & Time</th>
            {showProductColumn && <th className="py-3.5 px-4">Product / SKU</th>}
            <th className="py-3.5 px-4">Movement Type</th>
            <th className="py-3.5 px-4 text-right">Quantity</th>
            <th className="py-3.5 px-4 text-center">Stock Transition</th>
            <th className="py-3.5 px-4">Reference & Order</th>
            <th className="py-3.5 px-4">Reason / Notes</th>
            <th className="py-3.5 px-4">Performed By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-medium">
          {entries.map((item) => {
            const id = item._id || item.id;
            const product = typeof item.product === 'object' ? item.product : {};
            const mo = typeof item.manufacturingOrder === 'object' ? item.manufacturingOrder : {};
            const wo = typeof item.workOrder === 'object' ? item.workOrder : {};
            const user = typeof item.performedBy === 'object' ? item.performedBy : {};

            const isIncrease = ['FINISHED_GOODS_PRODUCTION', 'IN'].includes(item.movementType);
            const isDecrease = ['RAW_MATERIAL_CONSUMPTION', 'OUT'].includes(item.movementType);

            // Format date nicely
            const dateObj = item.movementDate ? new Date(item.movementDate) : item.createdAt ? new Date(item.createdAt) : new Date();
            const dateStr = dateObj.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Performed by display name
            const performerName =
              user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email || 'System / Operator';

            return (
              <tr
                key={id}
                onClick={() => onSelectEntry && onSelectEntry(item)}
                className={`hover:bg-gray-50/80 transition-colors duration-150 ${
                  onSelectEntry ? 'cursor-pointer' : ''
                }`}
              >
                {/* Date & Time */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-900">{dateStr}</div>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{timeStr}</span>
                  </div>
                </td>

                {/* Product / SKU */}
                {showProductColumn && (
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900 truncate max-w-[200px]">
                      {product.name || 'Unknown Product'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      SKU: <strong className="text-gray-600">{product.sku || 'N/A'}</strong>
                    </div>
                  </td>
                )}

                {/* Movement Type */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StockMovementBadge value={item.movementType} size="sm" />
                </td>

                {/* Quantity */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      isIncrease
                        ? 'bg-emerald-50 text-emerald-800'
                        : isDecrease
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-purple-50 text-purple-800'
                    }`}
                  >
                    {isIncrease && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                    {isDecrease && <TrendingDown className="w-3 h-3 text-amber-600" />}
                    <span>
                      {isIncrease ? '+' : isDecrease ? '-' : ''}
                      {dashboardUtils.formatNumber(item.quantity)}{' '}
                      <span className="text-[10px] opacity-75">{item.unitOfMeasure || product.unitOfMeasure || 'pcs'}</span>
                    </span>
                  </span>
                </td>

                {/* Stock Transition */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-700">
                    <span className="text-gray-500">{dashboardUtils.formatNumber(item.stockBefore)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="font-bold text-gray-900">{dashboardUtils.formatNumber(item.stockAfter)}</span>
                  </div>
                </td>

                {/* Reference & Order */}
                <td className="py-3.5 px-4">
                  {mo.moNumber && (
                    <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 w-fit mb-0.5">
                      <Factory className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{mo.moNumber}</span>
                    </div>
                  )}
                  {wo.woNumber && (
                    <div className="flex items-center gap-1 font-mono text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 w-fit">
                      <Layers className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{wo.woNumber}</span>
                    </div>
                  )}
                  {!mo.moNumber && !wo.woNumber && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      {item.referenceId || item.referenceType || '—'}
                    </span>
                  )}
                </td>

                {/* Reason / Notes */}
                <td className="py-3.5 px-4 max-w-[200px]">
                  <p className="text-[11px] text-gray-600 truncate" title={item.reason || ''}>
                    {item.reason || 'No specific notes provided'}
                  </p>
                </td>

                {/* Performed By */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-xs">{performerName}</span>
                  </div>
                  {user.role && (
                    <span className="text-[10px] text-gray-400 uppercase font-mono block ml-5">
                      {user.role}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockLedgerTable;
