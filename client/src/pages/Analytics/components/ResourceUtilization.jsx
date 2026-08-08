import React, { useState } from 'react';
import { analyticsUtils } from '../analytics.utils';
import {
  Factory,
  Activity,
  Clock,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  CheckCircle,
  Zap,
} from 'lucide-react';

/**
 * ResourceUtilization
 * Renders Work Center resource utilization analytics using backend data from GET /api/analytics/resource-utilization.
 * Calculates actual execution duration against planned durations per work center.
 */
export const ResourceUtilization = ({
  resourceUtilization,
  loading = false,
  error = null,
  onRetry = null,
}) => {
  const [selectedCenterId, setSelectedCenterId] = useState(null);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-100 rounded-xl w-full"></div>
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
                Resource Utilization Analytics Unavailable
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

  const metrics = resourceUtilization?.metrics || {};
  const workCenters = resourceUtilization?.byWorkCenter || [];

  const overallRatio = metrics.overallOperationalUtilizationPercentage || 0;
  const totalPlannedHrs = metrics.totalPlannedDurationHours || 0;
  const totalActualHrs = metrics.totalActualDurationHours || 0;
  const note = metrics.note || '';

  // Utility to style utilization percentage
  const getUtilizationRatioBadge = (pct) => {
    if (pct === 0) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (pct >= 90 && pct <= 110) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    }
    if (pct > 110) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs mb-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">
              Work Center Resource Utilization
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational capacity vs actual work order execution hours per shop floor work center
          </p>
        </div>

        {/* Overall Utilization Badge */}
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl">
          <div>
            <span className="text-[10px] text-purple-600 uppercase font-bold block">
              Overall Operational Ratio
            </span>
            <div className="text-lg font-bold font-mono text-purple-900">
              {analyticsUtils.formatPercentage(overallRatio)}
            </div>
          </div>
          <div className="w-px h-8 bg-purple-200"></div>
          <div className="text-xs text-purple-800 font-mono">
            <div>Actual: <strong>{totalActualHrs} hrs</strong></div>
            <div className="text-[10px] text-purple-600">Plan: {totalPlannedHrs} hrs</div>
          </div>
        </div>
      </div>

      {workCenters.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Factory className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-800">
            No work center utilization data available for this period.
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Work order execution durations are recorded when work center tasks are processed. Select a broader date range or execute work orders.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Work Center Comparative Duration Bars */}
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Planned vs Actual Work Order Execution Hours
            </h3>

            <div className="space-y-4">
              {workCenters.map((wc, idx) => {
                const maxVal = Math.max(wc.plannedHours || 0, wc.actualHours || 0, 1);
                const plannedPct = Math.round(((wc.plannedHours || 0) / maxVal) * 100);
                const actualPct = Math.round(((wc.actualHours || 0) / maxVal) * 100);
                const ratioBadge = getUtilizationRatioBadge(wc.operationalUtilizationRatioPercentage);

                return (
                  <div
                    key={wc.workCenterId || idx}
                    className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs text-gray-900">
                          [{wc.workCenterCode}] {wc.workCenterName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ratioBadge}`}>
                          {analyticsUtils.formatPercentage(wc.operationalUtilizationRatioPercentage)} Ratio
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                        <span>
                          Total WOs: <strong>{wc.totalWorkOrders}</strong> ({wc.completedWorkOrders} completed)
                        </span>
                        <span>
                          Cap: <strong>{wc.capacityPerHour}</strong>/hr
                        </span>
                      </div>
                    </div>

                    {/* Bars comparison */}
                    <div className="space-y-1.5 pt-1">
                      {/* Planned Hours Bar */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-16 font-mono text-gray-400 text-[10px] uppercase">Planned</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(plannedPct, 2)}%` }}
                            className="bg-gray-400 h-full rounded-full"
                          ></div>
                        </div>
                        <span className="w-14 font-mono font-semibold text-right text-gray-600">
                          {wc.plannedHours} hrs
                        </span>
                      </div>

                      {/* Actual Hours Bar */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-16 font-mono text-purple-700 font-bold text-[10px] uppercase">Actual</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(actualPct, 2)}%` }}
                            className="bg-purple-600 h-full rounded-full"
                          ></div>
                        </div>
                        <span className="w-14 font-mono font-bold text-right text-purple-900">
                          {wc.actualHours} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Work Center Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Work Center Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Cost / hr</th>
                  <th className="py-3 px-4 text-center">Work Orders</th>
                  <th className="py-3 px-4 text-right">Planned Hrs</th>
                  <th className="py-3 px-4 text-right">Actual Hrs</th>
                  <th className="py-3 px-4 text-center">Operational Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {workCenters.map((wc, idx) => {
                  const ratioBadge = getUtilizationRatioBadge(wc.operationalUtilizationRatioPercentage);

                  return (
                    <tr key={wc.workCenterId || idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold font-mono text-purple-800">
                        {wc.workCenterCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {wc.workCenterName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {wc.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">
                        ${analyticsUtils.formatMetricValue(wc.costPerHour, 2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-800">
                        {wc.completedWorkOrders} / {wc.totalWorkOrders}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        {wc.plannedHours} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-900">
                        {wc.actualHours} hrs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${ratioBadge}`}>
                          {analyticsUtils.formatPercentage(wc.operationalUtilizationRatioPercentage)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {note && (
            <p className="text-[11px] text-gray-400 italic text-right px-1">
              * {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceUtilization;
