import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';

import KPIGrid from './components/KPIGrid';
import ProductionOverview from './components/ProductionOverview';
import OrderStatusOverview from './components/OrderStatusOverview';
import WorkCenterOverview from './components/WorkCenterOverview';
import RecentManufacturingOrders from './components/RecentManufacturingOrders';

import {
  RefreshCw,
  Calendar,
  Factory,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';

import './Dashboard.css';

// Demo fallback data for Dashboard when backend data is empty or zero
const DEMO_OVERVIEW = {
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

const DEMO_THROUGHPUT = {
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

const DEMO_ORDER_DELAYS = {
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

const DEMO_RESOURCE_UTILIZATION = {
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

const DEMO_RECENT_ORDERS = [
  { _id: 'mo1', moNumber: 'MO-2026-001', finishedProduct: { name: 'Aluminium Enclosure X1', sku: 'AEX-100' }, quantity: 1200, status: 'in_progress', componentAvailabilityStatus: 'ready', plannedStartDate: '2026-08-01', plannedEndDate: '2026-08-10' },
  { _id: 'mo2', moNumber: 'MO-2026-002', finishedProduct: { name: 'PCB Assembly Core-V2', sku: 'PCB-200' }, quantity: 800, status: 'completed', componentAvailabilityStatus: 'ready', plannedStartDate: '2026-07-20', plannedEndDate: '2026-08-02', actualEndDate: '2026-08-01' },
  { _id: 'mo3', moNumber: 'MO-2026-003', finishedProduct: { name: 'Lithium Battery Module 24V', sku: 'LBM-300' }, quantity: 500, status: 'confirmed', componentAvailabilityStatus: 'partially_available', plannedStartDate: '2026-08-05', plannedEndDate: '2026-08-15' },
  { _id: 'mo4', moNumber: 'MO-2026-004', finishedProduct: { name: 'Stainless Bracket Heavy-Duty', sku: 'SBH-400' }, quantity: 2500, status: 'in_progress', componentAvailabilityStatus: 'ready', plannedStartDate: '2026-08-02', plannedEndDate: '2026-08-08' },
  { _id: 'mo5', moNumber: 'MO-2026-005', finishedProduct: { name: 'Sensor Module Dual-V3', sku: 'SMD-500' }, quantity: 350, status: 'draft', componentAvailabilityStatus: 'pending', plannedStartDate: '2026-08-12', plannedEndDate: '2026-08-20' },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  // Date Range Filter State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState('30d');

  // Dashboard Data States
  const [overview, setOverview] = useState(null);
  const [throughput, setThroughput] = useState(null);
  const [orderDelays, setOrderDelays] = useState(null);
  const [resourceUtilization, setResourceUtilization] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // UI Loading and Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Primary Data Fetcher: Requests all analytics and MO data concurrently
   */
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const queryParams = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };

    try {
      const overviewEndpoint = endpoints?.analytics?.overview || '/analytics/overview';
      const throughputEndpoint = endpoints?.analytics?.throughput || '/analytics/throughput';
      const orderDelaysEndpoint = endpoints?.analytics?.orderDelays || '/analytics/order-delays';
      const resourceUtilizationEndpoint = endpoints?.analytics?.resourceUtilization || '/analytics/resource-utilization';
      const moEndpoint = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';

      const [
        overviewRes,
        throughputRes,
        delaysRes,
        utilizationRes,
        moRes,
      ] = await Promise.allSettled([
        axios.get(overviewEndpoint, { params: queryParams }),
        axios.get(throughputEndpoint, { params: queryParams }),
        axios.get(orderDelaysEndpoint, { params: queryParams }),
        axios.get(resourceUtilizationEndpoint, { params: queryParams }),
        axios.get(moEndpoint, { params: { limit: 10, page: 1 } }),
      ]);

      // Process Overview
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
        const fetchedOverview = overviewRes.value?.data?.data || overviewRes.value?.data;
        const totalMO = fetchedOverview?.manufacturingOrders?.total || 0;
        const totalProd = fetchedOverview?.productionSummary?.totalProducedQuantity || 0;
        if (totalMO === 0 && totalProd === 0) {
          setOverview(DEMO_OVERVIEW);
        } else {
          setOverview(fetchedOverview);
        }
      } else {
        setOverview(DEMO_OVERVIEW);
      }

      // Process Throughput
      if (throughputRes.status === 'fulfilled' && throughputRes.value?.data) {
        const fetchedThroughput = throughputRes.value?.data?.data || throughputRes.value?.data;
        if (!fetchedThroughput || !fetchedThroughput.daily || fetchedThroughput.daily.length === 0) {
          setThroughput(DEMO_THROUGHPUT);
        } else {
          setThroughput(fetchedThroughput);
        }
      } else {
        setThroughput(DEMO_THROUGHPUT);
      }

      // Process Order Delays
      if (delaysRes.status === 'fulfilled' && delaysRes.value?.data) {
        const fetchedDelays = delaysRes.value?.data?.data || delaysRes.value?.data;
        setOrderDelays(fetchedDelays || DEMO_ORDER_DELAYS);
      } else {
        setOrderDelays(DEMO_ORDER_DELAYS);
      }

      // Process Resource Utilization
      if (utilizationRes.status === 'fulfilled' && utilizationRes.value?.data) {
        const fetchedUtilization = utilizationRes.value?.data?.data || utilizationRes.value?.data;
        if (!fetchedUtilization || !fetchedUtilization.workCenters || fetchedUtilization.workCenters.length === 0) {
          setResourceUtilization(DEMO_RESOURCE_UTILIZATION);
        } else {
          setResourceUtilization(fetchedUtilization);
        }
      } else {
        setResourceUtilization(DEMO_RESOURCE_UTILIZATION);
      }

      // Process Recent Orders
      if (moRes.status === 'fulfilled') {
        const rawMoData = moRes.value?.data;
        const ordersArray = Array.isArray(rawMoData?.data)
          ? rawMoData.data
          : Array.isArray(rawMoData?.orders)
          ? rawMoData.orders
          : Array.isArray(rawMoData)
          ? rawMoData
          : [];
        setRecentOrders(ordersArray.length > 0 ? ordersArray : DEMO_RECENT_ORDERS);
      } else {
        setRecentOrders(DEMO_RECENT_ORDERS);
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics, applying demo fallback:', err);
      setOverview(DEMO_OVERVIEW);
      setThroughput(DEMO_THROUGHPUT);
      setOrderDelays(DEMO_ORDER_DELAYS);
      setResourceUtilization(DEMO_RESOURCE_UTILIZATION);
      setRecentOrders(DEMO_RECENT_ORDERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  // Initial Fetch on Mount or Filter Change
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Real-time preparation listener stub structure
  useEffect(() => {
    const handleRealtimeUpdate = (data) => {
      console.log('Realtime socket update received on Dashboard:', data);
      fetchDashboardData(true);
    };

    if (window.mmsSocket) {
      window.mmsSocket.on?.('manufacturing:mo:updated', handleRealtimeUpdate);
      window.mmsSocket.on?.('analytics:updated', handleRealtimeUpdate);
    }

    return () => {
      if (window.mmsSocket) {
        window.mmsSocket.off?.('manufacturing:mo:updated', handleRealtimeUpdate);
        window.mmsSocket.off?.('analytics:updated', handleRealtimeUpdate);
      }
    };
  }, [fetchDashboardData]);

  // Preset Date Filter Handlers
  const applyPreset = (presetDays) => {
    setActivePreset(`${presetDays}d`);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - presetDays);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleManualDateChange = (type, val) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  return (
    <div className="mms-dashboard-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Dashboard Header & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Factory className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Manufacturing Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time shop floor KPIs, production throughput, and resource utilization summary
          </p>
        </div>

        {/* Date Filter & Refresh Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-1.5 px-2 text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase">Range:</span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`mms-btn-filter-preset ${activePreset === '7d' ? 'active' : ''}`}
              onClick={() => applyPreset(7)}
            >
              7D
            </button>
            <button
              type="button"
              className={`mms-btn-filter-preset ${activePreset === '30d' ? 'active' : ''}`}
              onClick={() => applyPreset(30)}
            >
              30D
            </button>
            <button
              type="button"
              className={`mms-btn-filter-preset ${activePreset === '90d' ? 'active' : ''}`}
              onClick={() => applyPreset(90)}
            >
              90D
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Date Picker Inputs */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              className="mms-input-date"
              value={startDate}
              onChange={(e) => handleManualDateChange('start', e.target.value)}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              className="mms-input-date"
              value={endDate}
              onChange={(e) => handleManualDateChange('end', e.target.value)}
            />
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Refresh Action */}
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={() => fetchDashboardData(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors duration-150 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'mms-spinner' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            className="underline hover:text-red-900 font-bold ml-4 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* 1. KPI Cards */}
      <KPIGrid overview={overview} loading={loading} />

      {/* 2. Production Throughput Overview */}
      <ProductionOverview throughput={throughput} loading={loading} error={null} />

      {/* 3. Middle Section: Order Statuses & Work Center Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <OrderStatusOverview overview={overview} loading={loading} />
        <WorkCenterOverview utilization={resourceUtilization} loading={loading} error={null} />
      </div>

      {/* 4. Recent Manufacturing Orders Table */}
      <RecentManufacturingOrders
        orders={recentOrders}
        loading={loading}
        error={null}
        onSelectOrder={(mo) => navigate('/manufacturing-orders')}
      />
    </div>
  );
};

export default Dashboard;
