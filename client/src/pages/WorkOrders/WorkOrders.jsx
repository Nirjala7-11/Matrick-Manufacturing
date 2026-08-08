import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import WOStatusBadge from './components/WOStatusBadge';
import WOProgress from './components/WOProgress';
import WOExecutionActions from './components/WOExecutionActions';
import WorkOrderDetails from './WorkOrderDetails';
import WorkOrderExecution from './WorkOrderExecution';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Eye,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Factory,
  Building,
  Hourglass,
  XCircle,
  Flame,
  Check,
} from 'lucide-react';

import './WorkOrders.css';

export const WorkOrders = () => {
  // Data States
  const [workOrders, setWorkOrders] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moFilter, setMoFilter] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState('');

  // Dropdown Lists for Filters
  const [moList, setMoList] = useState([]);
  const [workCenterList, setWorkCenterList] = useState([]);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedWoIdForDetails, setSelectedWoIdForDetails] = useState(null);

  const [isExecutionOpen, setIsExecutionOpen] = useState(false);
  const [selectedWoForExecution, setSelectedWoForExecution] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch MOs & Work Centers list for filter dropdowns
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const moUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
        const wcUrl = endpoints?.workCenters?.list || '/work-centers';

        const [moRes, wcRes] = await Promise.all([
          axios.get(moUrl, { params: { limit: 100 } }),
          axios.get(wcUrl, { params: { limit: 100 } }),
        ]);

        const mos = Array.isArray(moRes?.data?.data)
          ? moRes.data.data
          : Array.isArray(moRes?.data?.orders)
          ? moRes.data.orders
          : Array.isArray(moRes?.data)
          ? moRes.data
          : [];

        const wcs = Array.isArray(wcRes?.data?.data)
          ? wcRes.data.data
          : Array.isArray(wcRes?.data)
          ? wcRes.data
          : [];

        setMoList(mos);
        setWorkCenterList(wcs);
      } catch (err) {
        console.warn('Could not load dropdown options for Work Order filters:', err);
      }
    };
    fetchDropdownOptions();
  }, []);

  /**
   * Fetch Work Orders list using backend query parameters
   */
  const fetchWorkOrders = useCallback(
    async (pageNum = meta.page, pageLimit = meta.limit) => {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: pageLimit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (moFilter) {
        params.manufacturingOrder = moFilter;
      }
      if (workCenterFilter) {
        params.workCenter = workCenterFilter;
      }

      try {
        const baseUrl = endpoints?.workOrders?.list || '/work-orders';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        const list = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.workOrders)
          ? responseData.workOrders
          : Array.isArray(responseData)
          ? responseData
          : [];

        setWorkOrders(list);

        if (responseData?.meta) {
          setMeta({
            total: responseData.meta.total || list.length,
            page: responseData.meta.page || pageNum,
            limit: responseData.meta.limit || pageLimit,
            totalPages: responseData.meta.totalPages || 1,
          });
        } else {
          setMeta({
            total: list.length,
            page: pageNum,
            limit: pageLimit,
            totalPages: Math.ceil(list.length / pageLimit) || 1,
          });
        }
      } catch (err) {
        console.error('Error fetching Work Orders:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load Work Orders.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, moFilter, workCenterFilter, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchWorkOrders(1, meta.limit);
  }, [debouncedSearch, statusFilter, moFilter, workCenterFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchWorkOrders(newPage, meta.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    fetchWorkOrders(1, newLimit);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setMoFilter('');
    setWorkCenterFilter('');
  };

  // Open Modals
  const handleOpenDetails = (woItem) => {
    setSelectedWoIdForDetails(woItem._id || woItem.id);
    setIsDetailsOpen(true);
  };

  const handleOpenExecution = (woItem) => {
    setSelectedWoForExecution(woItem);
    setIsExecutionOpen(true);
  };

  // Action Success Handler
  const handleWorkflowActionSuccess = (updatedWO, actionType) => {
    showToastNotification(`Work Order #${updatedWO.woNumber || ''} ${actionType} successfully.`);
    fetchWorkOrders(meta.page, meta.limit);
  };

  // Metric Banner Counts
  const readyCount = workOrders.filter((w) => w.status === 'ready').length;
  const inProgressCount = workOrders.filter((w) => w.status === 'in_progress').length;
  const blockedCount = workOrders.filter((w) => w.status === 'blocked').length;
  const completedCount = workOrders.filter((w) => w.status === 'completed').length;

  return (
    <div className="mms-work-orders-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-semibold max-w-md animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Work Order Execution
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage shop floor operations, dispatch work center tasks, and track real-time execution progress
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchWorkOrders(meta.page, meta.limit)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Ready for Execution</span>
            <span className="text-2xl font-bold text-blue-700 mt-0.5 block">{readyCount}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">In Shop Execution</span>
            <span className="text-2xl font-bold text-amber-700 mt-0.5 block">{inProgressCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Blocked / Obstacle</span>
            <span className="text-2xl font-bold text-rose-700 mt-0.5 block">{blockedCount}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Completed Operations</span>
            <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">{completedCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search WO #, operation, notes..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-gray-50/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Work Center Filter */}
          <select
            value={workCenterFilter}
            onChange={(e) => setWorkCenterFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white max-w-[160px] truncate"
          >
            <option value="">All Work Centers</option>
            {workCenterList.map((wc) => (
              <option key={wc._id || wc.id} value={wc._id || wc.id}>
                {wc.name}
              </option>
            ))}
          </select>

          {/* MO Filter */}
          <select
            value={moFilter}
            onChange={(e) => setMoFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white max-w-[160px] truncate"
          >
            <option value="">All Parent MOs</option>
            {moList.map((mo) => (
              <option key={mo._id || mo.id} value={mo._id || mo.id}>
                {mo.moNumber}
              </option>
            ))}
          </select>

          {(statusFilter || moFilter || workCenterFilter || searchTerm) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchWorkOrders(1, meta.limit)}
            className="underline hover:text-red-900 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading Work Orders...</p>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Layers className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No work orders found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch || statusFilter || moFilter || workCenterFilter
                ? 'No shop floor work orders match your search parameters.'
                : 'Work orders are automatically created when confirmed Manufacturing Orders generate BOM operations.'}
            </p>
            {debouncedSearch || statusFilter || moFilter || workCenterFilter ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                  <th className="py-3.5 px-4">WO Ref #</th>
                  <th className="py-3.5 px-4">Operation & Seq</th>
                  <th className="py-3.5 px-4">Work Center</th>
                  <th className="py-3.5 px-4">Parent MO & Output</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Duration Progress</th>
                  <th className="py-3.5 px-4 text-center">Shop Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {workOrders.map((woItem) => {
                  const id = woItem._id || woItem.id;
                  const mo = typeof woItem.manufacturingOrder === 'object' ? woItem.manufacturingOrder : {};
                  const finishedProd = typeof mo.finishedProduct === 'object' ? mo.finishedProduct : {};
                  const wc = typeof woItem.workCenter === 'object' ? woItem.workCenter : {};

                  return (
                    <tr key={id} className="hover:bg-gray-50/80 transition-colors duration-150">
                      {/* WO Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(woItem)}
                          className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          {woItem.woNumber}
                        </button>
                      </td>

                      {/* Operation */}
                      <td className="py-3.5 px-4">
                        <div
                          className="font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => handleOpenDetails(woItem)}
                        >
                          {woItem.operationName}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Sequence #{woItem.sequence || 1}</span>
                      </td>

                      {/* Work Center */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{wc.name || 'Unassigned'}</span>
                        </div>
                        {wc.code && (
                          <span className="text-[10px] text-gray-400 font-mono">Code: {wc.code}</span>
                        )}
                      </td>

                      {/* Parent MO & Output Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-gray-900 text-[11px]">
                          {mo.moNumber || '—'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                          {finishedProd.name || 'Output Goods'} ({mo.quantity || 1} {finishedProd.unitOfMeasure || 'pcs'})
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <WOStatusBadge value={woItem.status} size="sm" />
                      </td>

                      {/* Duration Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">
                          <WOProgress
                            plannedDuration={woItem.plannedDurationMinutes}
                            actualDuration={woItem.actualDurationMinutes}
                            sequence={woItem.sequence}
                            status={woItem.status}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(woItem)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="View Operation Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Launch Shop Floor Terminal Mode */}
                          <button
                            type="button"
                            onClick={() => handleOpenExecution(woItem)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Shop Floor Execution Mode"
                          >
                            <Flame className="w-4 h-4" />
                          </button>

                          {/* Quick Actions Inline */}
                          <WOExecutionActions
                            workOrder={woItem}
                            onActionSuccess={(updatedWO, actionType) =>
                              handleWorkflowActionSuccess(updatedWO, actionType)
                            }
                            layout="standard"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && workOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={meta.limit}
                onChange={handleLimitChange}
                className="px-2 py-1 border border-gray-300 rounded bg-white text-xs font-semibold outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
              <span className="text-gray-400 mx-1">|</span>
              <span>
                Total <strong>{meta.total}</strong> work orders
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">
                Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Order Details Modal */}
      <WorkOrderDetails
        woId={selectedWoIdForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenExecution={(woItem) => handleOpenExecution(woItem)}
        onStatusChanged={() => fetchWorkOrders(meta.page, meta.limit)}
      />

      {/* Shop Floor Execution Modal Terminal */}
      <WorkOrderExecution
        workOrder={selectedWoForExecution}
        isOpen={isExecutionOpen}
        onClose={() => setIsExecutionOpen(false)}
        onStatusChanged={() => fetchWorkOrders(meta.page, meta.limit)}
      />
    </div>
  );
};

export default WorkOrders;
