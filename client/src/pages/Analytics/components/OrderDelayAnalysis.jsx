import React, { useState } from 'react';
import { analyticsUtils } from '../analytics.utils';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Package,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * OrderDelayAnalysis
 * Renders Manufacturing Order delay analytics using data directly from GET /api/analytics/order-delays.
 * An order is classified as delayed by the backend if actual end date exceeds planned end date,
 * or if open and past planned end date.
 */
export const OrderDelayAnalysis = ({
  orderDelays,
  loading = false,
  error = null,
  onRetry = null,
}) => {
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Order Delay Analytics Unavailable
              </h3>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const metrics = orderDelays?.metrics || {};
  const delayedOrders = orderDelays?.delayedOrders || [];

  const delayedCount = metrics.delayedOrdersCount || 0;
  const onTimeCount = metrics.onTimeCompletedOrders || 0;
  const avgDays = metrics.averageDelayDays || 0;
  const avgHours = metrics.averageDelayHours || 0;
  const unspecifiedDatesCount = metrics.unspecifiedPlannedEndDateCount || 0;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-gray-900">
              Manufacturing Order Delay Analysis
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Variance between planned schedule dates and actual order execution times
          </p>
        </div>

        {/* Summary Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-900">
              {delayedCount} Delayed Orders
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-900">
              {onTimeCount} On-Time Completed
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ml-1"
            title={expanded ? 'Collapse table' : 'Expand table'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">
            Average Delay Time
          </span>
          <div className="text-lg font-bold font-mono text-gray-900 mt-0.5">
            {avgDays > 0 ? `${avgDays} days` : `${avgHours} hours`}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Average schedule slippage across delayed orders
          </p>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">
            Schedule Integrity
          </span>
          <div className="text-lg font-bold font-mono text-gray-900 mt-0.5">
            {metrics.totalOrders > 0
              ? `${Math.round(((metrics.totalOrders - delayedCount) / metrics.totalOrders) * 100)}%`
              : '100%'}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            On-time execution compliance rate
          </p>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">
            Unscheduled Orders
          </span>
          <div className="text-lg font-bold font-mono text-gray-900 mt-0.5">
            {unspecifiedDatesCount}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Orders missing planned end date specifications
          </p>
        </div>
      </div>

      {/* Delayed Orders Table */}
      {expanded && (
        <>
          {delayedOrders.length === 0 ? (
            <div className="py-10 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-gray-800">
                No delayed manufacturing orders recorded.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                All completed and active manufacturing orders are operating strictly on schedule.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">MO Number</th>
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Planned End</th>
                    <th className="py-3 px-4">Actual / Current</th>
                    <th className="py-3 px-4 text-right">Delay Duration</th>
                    <th className="py-3 px-4 text-center">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {delayedOrders.map((order, idx) => {
                    const severity = analyticsUtils.getDelaySeverityBadge(order.delayDays);
                    const badgeClass = analyticsUtils.getStatusBadgeClass(order.status);

                    return (
                      <tr key={order.moId || idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold font-mono text-blue-700">
                          {order.moNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{order.productName}</div>
                          <div className="text-[10px] font-mono text-gray-400">SKU: {order.sku}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${badgeClass}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-800">
                          {analyticsUtils.formatMetricValue(order.quantity)}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {order.plannedEndDate
                            ? new Date(order.plannedEndDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {order.actualEndDate
                            ? new Date(order.actualEndDate).toLocaleDateString()
                            : 'In Progress (Active)'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                          {order.delayDays >= 1
                            ? `${order.delayDays} days`
                            : `${order.delayHours} hrs`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${severity.style}`}>
                            {severity.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderDelayAnalysis;
