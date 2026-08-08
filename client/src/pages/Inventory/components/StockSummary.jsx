import React from 'react';
import { dashboardUtils } from '../../Dashboard/dashboard.utils';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  History,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

/**
 * StockSummary
 * Displays high-level inventory metrics provided by backend endpoints.
 */
export const StockSummary = ({
  totalProducts = 0,
  totalStockOnHand = 0,
  lowStockCount = 0,
  outOfStockCount = 0,
  totalMovements = 0,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Catalog Items */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Catalog Items
          </span>
          <span className="text-2xl font-bold text-gray-900 mt-0.5 block font-mono">
            {loading ? '—' : dashboardUtils.formatNumber(totalProducts)}
          </span>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* Total Stock Units */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Stock Units
          </span>
          <span className="text-2xl font-bold text-gray-900 mt-0.5 block font-mono">
            {loading ? '—' : dashboardUtils.formatNumber(totalStockOnHand)}
          </span>
        </div>
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
          <Boxes className="w-5 h-5" />
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Low Stock Items
          </span>
          <span
            className={`text-2xl font-bold mt-0.5 block font-mono ${
              lowStockCount > 0 ? 'text-amber-700' : 'text-gray-900'
            }`}
          >
            {loading ? '—' : dashboardUtils.formatNumber(lowStockCount)}
          </span>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Out of Stock Items */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Out of Stock
          </span>
          <span
            className={`text-2xl font-bold mt-0.5 block font-mono ${
              outOfStockCount > 0 ? 'text-rose-700' : 'text-gray-900'
            }`}
          >
            {loading ? '—' : dashboardUtils.formatNumber(outOfStockCount)}
          </span>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <XCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Ledger Movements */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Stock Movements
          </span>
          <span className="text-2xl font-bold text-purple-700 mt-0.5 block font-mono">
            {loading ? '—' : dashboardUtils.formatNumber(totalMovements)}
          </span>
        </div>
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
          <History className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StockSummary;
