import React from 'react';
import { Layers, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ChevronRight } from 'lucide-react';
import {
  formatNumber,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
  calculateDisplayDelay,
} from '../dashboard.utils';

export const RecentManufacturingOrders = ({ orders, loading, error, onSelectOrder }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-xs mb-6 p-4 text-red-600 text-sm">
        Failed to load recent manufacturing orders: {error}
      </div>
    );
  }

  const orderList = Array.isArray(orders) ? orders : [];

  return (
    <div id="dashboard-recent-orders" className="bg-white rounded-xl border border-gray-200 shadow-xs mb-6 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Recent Manufacturing Orders</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Active and newly updated manufacturing orders on the shop floor
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit">
          Showing {orderList.length} orders
        </span>
      </div>

      {orderList.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Layers className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-medium">No manufacturing orders available.</p>
          <p className="text-xs text-gray-400 mt-1">Create new manufacturing orders to start tracking shop floor execution.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100 text-[11px]">
                <th className="py-3 px-4">MO Number</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Component Readiness</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Schedule State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {orderList.map((mo) => {
                const productName = mo.finishedProduct?.name || mo.productName || 'N/A';
                const productSku = mo.finishedProduct?.sku || mo.sku || '';
                const delayInfo = calculateDisplayDelay(
                  mo.plannedEndDate,
                  mo.actualEndDate,
                  mo.status
                );

                return (
                  <tr
                    key={mo._id || mo.id || mo.moNumber}
                    className="hover:bg-gray-50/80 transition-colors duration-150 cursor-pointer"
                    onClick={() => onSelectOrder && onSelectOrder(mo)}
                  >
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      {mo.moNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-semibold truncate max-w-[200px]">{productName}</div>
                      {productSku && <div className="text-[10px] text-gray-400">SKU: {productSku}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-800">
                      {formatNumber(mo.quantity)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getStatusBadgeClass(mo.status)}`}>
                        {formatStatus(mo.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getStatusBadgeClass(mo.componentAvailabilityStatus)}`}>
                        <ShieldAlert className="w-3 h-3" />
                        {formatStatus(mo.componentAvailabilityStatus || 'N/A')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(mo.plannedEndDate || mo.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {delayInfo.isDelayed ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          {delayInfo.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          On Schedule
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentManufacturingOrders;
