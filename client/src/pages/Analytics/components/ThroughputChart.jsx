import React, { useState } from 'react';
import { analyticsUtils } from '../analytics.utils';
import {
  TrendingUp,
  PackageCheck,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Boxes,
  Layers,
  List,
  BarChart,
} from 'lucide-react';

/**
 * ThroughputChart
 * Renders production throughput analytics using data directly from GET /api/analytics/throughput.
 * Displays daily finished goods production trend and top product breakdown.
 */
export const ThroughputChart = ({
  throughput,
  loading = false,
  error = null,
  onRetry = null,
}) => {
  const [chartMode, setChartMode] = useState('bar'); // 'bar' | 'table'

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/3 mb-4"></div>
        <div className="h-56 bg-gray-100 rounded-xl w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded-sm w-1/4"></div>
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
                Production Throughput Analytics Unavailable
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

  const trend = throughput?.trend || [];
  const topProducts = throughput?.productionByProduct || [];
  const metrics = throughput?.metrics || {};

  const maxQuantity = Math.max(...trend.map((t) => t.quantity || 0), 1);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs mb-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">
              Production Throughput Analytics
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Finished goods stock additions from executed manufacturing completion events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Summary Metric Pills */}
          <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans block">Total Volume</span>
              <span className="font-bold text-gray-900">
                {analyticsUtils.formatMetricValue(metrics.totalProducedQuantity || 0)} units
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans block">Batches</span>
              <span className="font-bold text-blue-700">
                {analyticsUtils.formatMetricValue(metrics.totalProductionEvents || 0)} events
              </span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setChartMode('bar')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Bar Chart View"
            >
              <BarChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                chartMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Data Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <TrendingUp className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-800">
            No production throughput data available for this period.
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Throughput records are created automatically when manufacturing orders produce finished goods. Select a broader date range or complete pending orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Table View Area */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Daily Production Trend
            </h3>

            {chartMode === 'bar' ? (
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                {/* Visual Chart Bars */}
                <div className="h-56 flex items-end gap-2 pt-8 pb-2 px-2 border-b border-gray-200 overflow-x-auto">
                  {trend.map((item, idx) => {
                    const heightPercent = Math.round(((item.quantity || 0) / maxQuantity) * 100);
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[24px] flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-12 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none font-mono">
                          <div className="font-bold text-blue-300">
                            {analyticsUtils.formatDateShort(item.date)}
                          </div>
                          <div>
                            Qty: <strong>{analyticsUtils.formatMetricValue(item.quantity)}</strong> units ({item.events} events)
                          </div>
                        </div>

                        {/* Bar Graphic */}
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-150 relative cursor-pointer mms-chart-bar-hover"
                        ></div>

                        {/* Date Label */}
                        <span className="text-[10px] text-gray-500 font-mono mt-2 truncate max-w-[36px] text-center">
                          {analyticsUtils.formatDateShort(item.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-2 px-1">
                  <span>Scale: 0 to {analyticsUtils.formatMetricValue(maxQuantity)} units</span>
                  <span>{trend.length} recorded production days</span>
                </div>
              </div>
            ) : (
              /* Daily Trend Table */
              <div className="overflow-x-auto border border-gray-200 rounded-2xl max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Produced Quantity</th>
                      <th className="py-2.5 px-4 text-right">Events Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {trend.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50 font-mono">
                        <td className="py-2 px-4 font-bold text-gray-900">
                          {t.date}
                        </td>
                        <td className="py-2 px-4 text-right text-blue-700 font-bold">
                          {analyticsUtils.formatMetricValue(t.quantity)} units
                        </td>
                        <td className="py-2 px-4 text-right text-gray-600">
                          {t.events}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Products Breakdown */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Top Output Products
                </h3>
                <PackageCheck className="w-4 h-4 text-gray-400" />
              </div>

              {topProducts.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-6 text-center">
                  No product output breakdown available.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {topProducts.map((prod, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-gray-200 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                        <span className="truncate max-w-[150px]" title={prod.productName}>
                          {prod.productName}
                        </span>
                        <span className="font-mono text-blue-700">
                          {analyticsUtils.formatMetricValue(prod.totalQuantity)} {prod.unitOfMeasure || 'pcs'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <span>SKU: {prod.sku || 'N/A'}</span>
                        <span>{prod.eventCount} production events</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium border-t border-gray-200/80 pt-2">
              Ranked by total finished goods output
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThroughputChart;
