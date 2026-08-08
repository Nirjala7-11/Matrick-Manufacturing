import React from 'react';
import { analyticsUtils } from '../analytics.utils';
import {
  Package,
  Boxes,
  Factory,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  FileCheck,
} from 'lucide-react';

/**
 * AnalyticsKPIGrid
 * Renders key performance metrics returned directly by backend analytics APIs.
 * Does NOT recalculate or invent unsupported metric formulas in React.
 */
export const AnalyticsKPIGrid = ({
  overview,
  throughputMetrics,
  delayMetrics,
  utilizationMetrics,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-7 bg-gray-300 rounded w-3/4 my-2"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // 1. Total Produced Quantity
  const totalProduced =
    throughputMetrics?.totalProducedQuantity ??
    overview?.productionSummary?.totalProducedQuantity ??
    0;
  const productionEvents =
    throughputMetrics?.totalProductionEvents ??
    overview?.productionSummary?.totalProductionEvents ??
    0;

  // 2. Manufacturing Order Completion Rate & Total Orders
  const totalMoCount =
    delayMetrics?.totalOrders ?? overview?.manufacturingOrders?.total ?? 0;
  const completedMoCount =
    overview?.manufacturingOrders?.byStatus?.completed ??
    delayMetrics?.byStatus?.completed ??
    0;

  // 3. Delayed Orders & Average Delay
  const delayedMoCount =
    delayMetrics?.delayedOrdersCount ??
    overview?.manufacturingOrders?.delayedCount ??
    0;
  const avgDelayDays = delayMetrics?.averageDelayDays ?? 0;
  const avgDelayHours = delayMetrics?.averageDelayHours ?? 0;

  // 4. Resource Utilization Ratio
  const overallUtilizationPct =
    utilizationMetrics?.overallOperationalUtilizationPercentage ?? 0;
  const totalActualHrs = utilizationMetrics?.totalActualDurationHours ?? 0;
  const totalPlannedHrs = utilizationMetrics?.totalPlannedDurationHours ?? 0;

  // 5. Active Master Data Readiness
  const activeWcs = overview?.masterData?.workCenters?.active ?? 0;
  const totalWcs = overview?.masterData?.workCenters?.total ?? 0;
  const activeProds = overview?.masterData?.products?.active ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* KPI 1: Production Throughput Volume */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Total Production
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-gray-900">
            {analyticsUtils.formatMetricValue(totalProduced)}
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            Across <strong className="text-gray-800">{productionEvents}</strong> completion events
          </p>
        </div>
      </div>

      {/* KPI 2: Total MOs & Completed Orders */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Manufacturing Orders
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-gray-900">
            {analyticsUtils.formatMetricValue(totalMoCount)}
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            <strong className="text-emerald-700">{completedMoCount}</strong> completed in period
          </p>
        </div>
      </div>

      {/* KPI 3: Delayed Orders & Average Delay */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Order Delays
          </span>
          <div className={`p-2 rounded-lg ${delayedMoCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-2xl font-bold font-mono ${delayedMoCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {analyticsUtils.formatMetricValue(delayedMoCount)}
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            Avg Delay: <strong className="text-gray-800">{avgDelayDays > 0 ? `${avgDelayDays} days` : `${avgDelayHours} hrs`}</strong>
          </p>
        </div>
      </div>

      {/* KPI 4: Operational Resource Utilization */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Work Center Utilization
          </span>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-purple-700">
            {analyticsUtils.formatPercentage(overallUtilizationPct)}
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1 truncate" title={`Actual: ${totalActualHrs} hrs / Planned: ${totalPlannedHrs} hrs`}>
            Actual: <strong className="text-gray-800">{totalActualHrs} hrs</strong> / Plan: {totalPlannedHrs} hrs
          </p>
        </div>
      </div>

      {/* KPI 5: Work Center Readiness */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Work Centers Active
          </span>
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <Factory className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-gray-900">
            {activeWcs} <span className="text-xs font-sans text-gray-400">/ {totalWcs}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            Catalog: <strong className="text-gray-800">{activeProds} active products</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsKPIGrid;
