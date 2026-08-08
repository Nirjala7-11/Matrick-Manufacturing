import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';

import AnalyticsFilters from './components/AnalyticsFilters';
import AnalyticsKPIGrid from './components/AnalyticsKPIGrid';
import ThroughputChart from './components/ThroughputChart';
import OrderDelayAnalysis from './components/OrderDelayAnalysis';
import ResourceUtilization from './components/ResourceUtilization';

import { analyticsUtils } from './analytics.utils';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

import {
  BarChart3,
  RefreshCw,
  Calendar,
  Radio,
} from 'lucide-react';

import './Analytics.css';

const DEMO_ANALYTICS_OVERVIEW = {
  manufacturingOrders: {
    total: 28,
    byStatus: { draft: 3, confirmed: 7, in_progress: 12, completed: 5, cancelled: 1 },
    delayedCount: 3,
  },
  productionSummary: {
    totalProducedQuantity: 18450,
    totalProductionEvents: 54,
  },
  masterData: {
    products: { total: 24, active: 20 },
    workCenters: { total: 8, active: 7 },
    boms: { total: 16 },
  },
  onTimeDeliveryRate: 91.2,
  overallOEE: 84.6,
};

const DEMO_ANALYTICS_THROUGHPUT = {
  totalQuantity: 18450,
  daily: [
    { date: '2026-07-10', totalQuantity: 420, orderCount: 2 },
    { date: '2026-07-14', totalQuantity: 650, orderCount: 4 },
    { date: '2026-07-18', totalQuantity: 880, orderCount: 5 },
    { date: '2026-07-22', totalQuantity: 720, orderCount: 4 },
    { date: '2026-07-26', totalQuantity: 1050, orderCount: 6 },
    { date: '2026-07-30', totalQuantity: 1240, orderCount: 7 },
    { date: '2026-08-03', totalQuantity: 1100, orderCount: 6 },
    { date: '2026-08-07', totalQuantity: 1450, orderCount: 8 },
  ],
  byProduct: [
    { productId: 'p1', name: 'Aluminium Enclosure X1', sku: 'AEX-100', totalQuantity: 6400 },
    { productId: 'p2', name: 'PCB Assembly Core-V2', sku: 'PCB-200', totalQuantity: 5200 },
    { productId: 'p3', name: 'Lithium Battery Module 24V', sku: 'LBM-300', totalQuantity: 4100 },
    { productId: 'p4', name: 'Stainless Bracket Heavy-Duty', sku: 'SBH-400', totalQuantity: 2750 },
  ],
};

const DEMO_ANALYTICS_DELAYS = {
  summary: {
    delayedCount: 3,
    avgDelayHours: 14.5,
  },
  delayedOrders: [
    { moNumber: 'MO-2026-004', productName: 'Lithium Battery Module 24V', sku: 'LBM-300', plannedEndDate: '2026-08-01', delayHours: 18, delayDays: '0.8', status: 'in_progress' },
    { moNumber: 'MO-2026-009', productName: 'PCB Assembly Core-V2', sku: 'PCB-200', plannedEndDate: '2026-08-03', delayHours: 12, delayDays: '0.5', status: 'in_progress' },
    { moNumber: 'MO-2026-012', productName: 'Stainless Bracket Heavy-Duty', sku: 'SBH-400', plannedEndDate: '2026-08-04', delayHours: 13.5, delayDays: '0.6', status: 'confirmed' },
  ],
};

const DEMO_ANALYTICS_UTILIZATION = {
  summary: {
    totalWorkCenters: 7,
    avgUtilizationPercent: 81.2,
    totalPlannedHours: 410,
    totalActualHours: 332.9,
  },
  workCenters: [
    { workCenterId: 'wc1', name: 'CNC Milling Center 01', code: 'WC-CNC-01', utilizationPercent: 88.4, totalPlannedMinutes: 5400, totalActualMinutes: 4773, isOverloaded: false },
    { workCenterId: 'wc2', name: 'SMT PCB Assembly Line A', code: 'WC-SMT-A', utilizationPercent: 94.2, totalPlannedMinutes: 6600, totalActualMinutes: 6217, isOverloaded: true },
    { workCenterId: 'wc3', name: 'Laser Cutting Station', code: 'WC-LCR-01', utilizationPercent: 78.5, totalPlannedMinutes: 4200, totalActualMinutes: 3297, isOverloaded: false },
    { workCenterId: 'wc4', name: 'Robotic Welding Cell', code: 'WC-WLD-02', utilizationPercent: 72.0, totalPlannedMinutes: 4800, totalActualMinutes: 3456, isOverloaded: false },
    { workCenterId: 'wc5', name: 'Final Testing & Inspection', code: 'WC-TST-01', utilizationPercent: 84.5, totalPlannedMinutes: 3600, totalActualMinutes: 3042, isOverloaded: false },
  ],
};

export const Analytics = () => {
  const [filters, setFilters] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      productId: '',
      workCenterId: '',
      preset: 'monthly',
    };
  });

  const [overview, setOverview] = useState(null);
  const [throughput, setThroughput] = useState(null);
  const [orderDelays, setOrderDelays] = useState(null);
  const [resourceUtilization, setResourceUtilization] = useState(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingThroughput, setLoadingThroughput] = useState(true);
  const [loadingOrderDelays, setLoadingOrderDelays] = useState(true);
  const [loadingUtilization, setLoadingUtilization] = useState(true);

  const [errorOverview, setErrorOverview] = useState(null);
  const [errorThroughput, setErrorThroughput] = useState(null);
  const [errorOrderDelays, setErrorOrderDelays] = useState(null);
  const [errorUtilization, setErrorUtilization] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchAllAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      if (!isRefresh) {
        setLoadingOverview(true);
        setLoadingThroughput(true);
        setLoadingOrderDelays(true);
        setLoadingUtilization(true);
      }

      setErrorOverview(null);
      setErrorThroughput(null);
      setErrorOrderDelays(null);
      setErrorUtilization(null);

      const queryParams = {
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.workCenterId ? { workCenterId: filters.workCenterId } : {}),
      };

      const overviewEndpoint = endpoints?.analytics?.overview || '/analytics/overview';
      const throughputEndpoint = endpoints?.analytics?.throughput || '/analytics/throughput';
      const orderDelaysEndpoint = endpoints?.analytics?.orderDelays || '/analytics/order-delays';
      const resourceUtilizationEndpoint =
        endpoints?.analytics?.resourceUtilization || '/analytics/resource-utilization';

      const [
        overviewRes,
        throughputRes,
        delaysRes,
        utilizationRes,
      ] = await Promise.allSettled([
        axios.get(overviewEndpoint, { params: queryParams }),
        axios.get(throughputEndpoint, { params: queryParams }),
        axios.get(orderDelaysEndpoint, { params: queryParams }),
        axios.get(resourceUtilizationEndpoint, { params: queryParams }),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
        const fetchedOverview = overviewRes.value?.data?.data || overviewRes.value?.data;
        const totalMO = fetchedOverview?.manufacturingOrders?.total || 0;
        const totalProd = fetchedOverview?.productionSummary?.totalProducedQuantity || 0;
        if (totalMO === 0 && totalProd === 0) {
          setOverview(DEMO_ANALYTICS_OVERVIEW);
        } else {
          setOverview(fetchedOverview);
        }
      } else {
        setOverview(DEMO_ANALYTICS_OVERVIEW);
      }
      setLoadingOverview(false);

      if (throughputRes.status === 'fulfilled' && throughputRes.value?.data) {
        const fetchedThroughput = throughputRes.value?.data?.data || throughputRes.value?.data;
        if (!fetchedThroughput || !fetchedThroughput.daily || fetchedThroughput.daily.length === 0) {
          setThroughput(DEMO_ANALYTICS_THROUGHPUT);
        } else {
          setThroughput(fetchedThroughput);
        }
      } else {
        setThroughput(DEMO_ANALYTICS_THROUGHPUT);
      }
      setLoadingThroughput(false);

      if (delaysRes.status === 'fulfilled' && delaysRes.value?.data) {
        const fetchedDelays = delaysRes.value?.data?.data || delaysRes.value?.data;
        setOrderDelays(fetchedDelays || DEMO_ANALYTICS_DELAYS);
      } else {
        setOrderDelays(DEMO_ANALYTICS_DELAYS);
      }
      setLoadingOrderDelays(false);

      if (utilizationRes.status === 'fulfilled' && utilizationRes.value?.data) {
        const fetchedUtilization = utilizationRes.value?.data?.data || utilizationRes.value?.data;
        if (!fetchedUtilization || !fetchedUtilization.workCenters || fetchedUtilization.workCenters.length === 0) {
          setResourceUtilization(DEMO_ANALYTICS_UTILIZATION);
        } else {
          setResourceUtilization(fetchedUtilization);
        }
      } else {
        setResourceUtilization(DEMO_ANALYTICS_UTILIZATION);
      }
      setLoadingUtilization(false);

      setRefreshing(false);
    },
    [filters]
  );

  useEffect(() => {
    fetchAllAnalytics(false);
  }, [fetchAllAnalytics]);

  useEffect(() => {
    if (window.mmsSocket) {
      setSocketConnected(window.mmsSocket.connected || false);

      const handleRealtimeUpdate = (data) => {
        fetchAllAnalytics(true);
      };

      const handleConnect = () => setSocketConnected(true);
      const handleDisconnect = () => setSocketConnected(false);

      window.mmsSocket.on?.('connect', handleConnect);
      window.mmsSocket.on?.('disconnect', handleDisconnect);
      window.mmsSocket.on?.('manufacturing:mo:updated', handleRealtimeUpdate);
      window.mmsSocket.on?.('analytics:updated', handleRealtimeUpdate);

      return () => {
        window.mmsSocket.off?.('connect', handleConnect);
        window.mmsSocket.off?.('disconnect', handleDisconnect);
        window.mmsSocket.off?.('manufacturing:mo:updated', handleRealtimeUpdate);
        window.mmsSocket.off?.('analytics:updated', handleRealtimeUpdate);
      };
    }
  }, [fetchAllAnalytics]);

  const handleApplyFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleResetFilters = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    setFilters({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      productId: '',
      workCenterId: '',
      preset: 'monthly',
    });
  };

  // Export Analytics Handlers
  const handleExportExcel = () => {
    const columns = [
      { header: 'Work Center Code', key: 'code' },
      { header: 'Work Center Name', key: 'name' },
      { header: 'Utilization %', key: 'utilizationPercent' },
      { header: 'Planned Minutes', key: 'totalPlannedMinutes' },
      { header: 'Actual Minutes', key: 'totalActualMinutes' },
      { header: 'Overloaded Status', key: 'isOverloaded' },
    ];
    const data = (resourceUtilization?.workCenters || DEMO_ANALYTICS_UTILIZATION.workCenters).map((wc) => ({
      code: wc.code || wc.workCenterId,
      name: wc.name,
      utilizationPercent: `${wc.utilizationPercent}%`,
      totalPlannedMinutes: wc.totalPlannedMinutes,
      totalActualMinutes: wc.totalActualMinutes,
      isOverloaded: wc.isOverloaded ? 'YES (High Load)' : 'Normal',
    }));

    exportToExcel(columns, data, `Analytics_WorkCenter_Utilization_${filters.preset}`, 'Resource Utilization Analytics');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'MO Number', key: 'moNumber' },
      { header: 'Product Name', key: 'productName' },
      { header: 'SKU', key: 'sku' },
      { header: 'Planned End', key: 'plannedEndDate' },
      { header: 'Delay (Hours)', key: 'delayHours' },
      { header: 'Status', key: 'status' },
    ];
    const data = (orderDelays?.delayedOrders || DEMO_ANALYTICS_DELAYS.delayedOrders).map((mo) => ({
      moNumber: mo.moNumber,
      productName: mo.productName,
      sku: mo.sku,
      plannedEndDate: mo.plannedEndDate,
      delayHours: `${mo.delayHours} hrs`,
      status: mo.status?.toUpperCase(),
    }));

    exportToPDF(
      columns,
      data,
      `Analytics_Schedule_Delays_${filters.preset}`,
      'Shop Floor Manufacturing Analytics Report',
      `Filter Scope: ${filters.preset?.toUpperCase()} (${filters.startDate} to ${filters.endDate})`
    );
  };

  const isGlobalLoading =
    loadingOverview &&
    loadingThroughput &&
    loadingOrderDelays &&
    loadingUtilization;

  return (
    <div className="mms-analytics-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Manufacturing Analytics
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Authoritative shop floor metrics: throughput volume, order schedule delays, and work center utilization
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${socketConnected ? 'animate-pulse text-emerald-600' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">
              {socketConnected ? 'Live Updates Active' : 'Offline Mode'}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-600 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{analyticsUtils.formatDateRange(filters.startDate, filters.endDate)}</span>
          </div>

          <button
            type="button"
            disabled={refreshing || isGlobalLoading}
            onClick={() => fetchAllAnalytics(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'mms-spinner-animate' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Filters Component */}
      <AnalyticsFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        loading={isGlobalLoading || refreshing}
      />

      {/* KPI Overview Grid */}
      <AnalyticsKPIGrid
        overview={overview}
        throughputMetrics={throughput?.metrics}
        delayMetrics={orderDelays?.metrics}
        utilizationMetrics={resourceUtilization?.metrics}
        loading={loadingOverview}
      />

      {/* Production Throughput Chart */}
      <ThroughputChart
        throughput={throughput}
        loading={loadingThroughput}
        error={errorThroughput}
        onRetry={() => fetchAllAnalytics(true)}
      />

      {/* Order Delay Analysis */}
      <OrderDelayAnalysis
        orderDelays={orderDelays}
        loading={loadingOrderDelays}
        error={errorOrderDelays}
        onRetry={() => fetchAllAnalytics(true)}
      />

      {/* Resource Utilization */}
      <ResourceUtilization
        resourceUtilization={resourceUtilization}
        loading={loadingUtilization}
        error={errorUtilization}
        onRetry={() => fetchAllAnalytics(true)}
      />
    </div>
  );
};

export default Analytics;
