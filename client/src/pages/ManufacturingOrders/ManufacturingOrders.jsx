import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import ManufacturingOrderForm from './ManufacturingOrderForm';
import ManufacturingOrderDetails from './ManufacturingOrderDetails';
import MOStatusBadge from './components/MOStatusBadge';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Factory,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Check,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Clock,
  Calendar,
  Flame,
  Layers,
} from 'lucide-react';

import './ManufacturingOrders.css';

export const ManufacturingOrders = () => {
  // Data States
  const [orders, setOrders] = useState([]);
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
  const [priorityFilter, setPriorityFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Product Dropdown Options List
  const [productsList, setProductsList] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMoForForm, setSelectedMoForForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMoIdForDetails, setSelectedMoIdForDetails] = useState(null);

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

  // Fetch product list for filter dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prodUrl = endpoints?.products?.list || '/products';
        const res = await axios.get(prodUrl, { params: { limit: 100 } });
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setProductsList(list);
      } catch (err) {
        console.warn('Could not load products for filter:', err);
      }
    };
    fetchProducts();
  }, []);

  /**
   * Fetch Manufacturing Orders list with pagination, search, and filters
   */
  const fetchOrders = useCallback(
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
      if (priorityFilter) {
        params.priority = priorityFilter;
      }
      if (availabilityFilter) {
        params.componentAvailabilityStatus = availabilityFilter;
      }
      if (productFilter) {
        params.finishedProduct = productFilter;
      }

      try {
        const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        const list = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.orders)
          ? responseData.orders
          : Array.isArray(responseData)
          ? responseData
          : [];

        setOrders(list);

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
        console.error('Error fetching Manufacturing Orders:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load Manufacturing Orders.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, priorityFilter, availabilityFilter, productFilter, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchOrders(1, meta.limit);
  }, [debouncedSearch, statusFilter, priorityFilter, availabilityFilter, productFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchOrders(newPage, meta.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    fetchOrders(1, newLimit);
  };

  // Quick Workflow Actions
  const handleConfirmOrder = async (moItem) => {
    const id = moItem._id || moItem.id;
    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      await axios.post(`${baseUrl}/${id}/confirm`);
      showToastNotification(`Manufacturing Order #${moItem.moNumber} confirmed.`);
      fetchOrders(meta.page, meta.limit);
    } catch (err) {
      console.error('Error confirming MO:', err);
      showToastNotification(err?.response?.data?.message || 'Failed to confirm order.', 'error');
    }
  };

  const handleStartOrder = async (moItem) => {
    const id = moItem._id || moItem.id;
    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      await axios.post(`${baseUrl}/${id}/start`);
      showToastNotification(`Manufacturing Order #${moItem.moNumber} execution started.`);
      fetchOrders(meta.page, meta.limit);
    } catch (err) {
      console.error('Error starting MO:', err);
      showToastNotification(err?.response?.data?.message || 'Failed to start order execution.', 'error');
    }
  };

  const handleCompleteOrder = async (moItem) => {
    const id = moItem._id || moItem.id;
    if (!window.confirm(`Are you sure you want to complete Order #${moItem.moNumber}? Finished goods stock will be posted.`)) {
      return;
    }

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      await axios.post(`${baseUrl}/${id}/complete`);
      showToastNotification(`Manufacturing Order #${moItem.moNumber} completed successfully.`);
      fetchOrders(meta.page, meta.limit);
    } catch (err) {
      console.error('Error completing MO:', err);
      showToastNotification(err?.response?.data?.message || 'Failed to complete order.', 'error');
    }
  };

  const handleCancelOrder = async (moItem) => {
    const id = moItem._id || moItem.id;
    if (!window.confirm(`Are you sure you want to cancel Manufacturing Order #${moItem.moNumber}?`)) {
      return;
    }

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      await axios.post(`${baseUrl}/${id}/cancel`);
      showToastNotification(`Manufacturing Order #${moItem.moNumber} cancelled.`);
      fetchOrders(meta.page, meta.limit);
    } catch (err) {
      console.error('Error cancelling MO:', err);
      showToastNotification(err?.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  // Modal Handlers
  const handleOpenCreateForm = () => {
    setSelectedMoForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (moItem) => {
    setSelectedMoForForm(moItem);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (moItem) => {
    setSelectedMoIdForDetails(moItem._id || moItem.id);
    setIsDetailsOpen(true);
  };

  const handleFormSuccess = (savedMO, actionType) => {
    showToastNotification(
      `Manufacturing Order #${savedMO.moNumber || ''} successfully ${actionType}.`
    );
    fetchOrders(meta.page, meta.limit);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setAvailabilityFilter('');
    setProductFilter('');
  };

  // Metric Banner Counts
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
  const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const insufficientStockCount = orders.filter((o) => o.componentAvailabilityStatus === 'insufficient').length;

  return (
    <div className="mms-mos-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
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
            <Factory className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Manufacturing Orders (MO)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Schedule shop floor production runs, monitor raw material stock availability, and track order completion
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Production Order</span>
        </button>
      </div>

      {/* Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Production Orders</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">{meta.total}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Factory className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Confirmed & Ready</span>
            <span className="text-2xl font-bold text-blue-700 mt-0.5 block">{confirmedCount}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Check className="w-5 h-5" />
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
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Completed Goods</span>
            <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">{completedCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search MO # or notes..."
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

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white max-w-[160px] truncate"
          >
            <option value="">All Finished Goods</option>
            {productsList.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
          >
            <option value="">All Stock Statuses</option>
            <option value="available">Available</option>
            <option value="partially_available">Partially Available</option>
            <option value="insufficient">Insufficient Stock</option>
          </select>

          {(statusFilter || priorityFilter || availabilityFilter || productFilter || searchTerm) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchOrders(meta.page, meta.limit)}
            className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
            onClick={() => fetchOrders(1, meta.limit)}
            className="underline hover:text-red-900 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Manufacturing Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading Manufacturing Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Factory className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No manufacturing orders found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch || statusFilter || priorityFilter || productFilter || availabilityFilter
                ? 'No production orders match your filter parameters.'
                : 'Get started by creating your first shop floor manufacturing order.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(debouncedSearch || statusFilter || priorityFilter || productFilter || availabilityFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                New Production Order
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                  <th className="py-3.5 px-4">MO Ref #</th>
                  <th className="py-3.5 px-4">Finished Goods</th>
                  <th className="py-3.5 px-4 text-right">Target Qty</th>
                  <th className="py-3.5 px-4 text-center">Priority</th>
                  <th className="py-3.5 px-4 text-center">Raw Material Stock</th>
                  <th className="py-3.5 px-4 text-center">Execution Status</th>
                  <th className="py-3.5 px-4">Planned Start</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {orders.map((moItem) => {
                  const id = moItem._id || moItem.id;
                  const finishedProd = typeof moItem.finishedProduct === 'object' ? moItem.finishedProduct : {};

                  return (
                    <tr key={id} className="hover:bg-gray-50/80 transition-colors duration-150">
                      {/* MO Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(moItem)}
                          className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          {moItem.moNumber}
                        </button>
                      </td>

                      {/* Finished Goods */}
                      <td className="py-3.5 px-4">
                        <div
                          className="font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors truncate max-w-[200px]"
                          onClick={() => handleOpenDetails(moItem)}
                        >
                          {finishedProd.name || 'Output Product'}
                        </div>
                        {finishedProd.sku && (
                          <span className="text-[10px] text-gray-400 font-mono">SKU: {finishedProd.sku}</span>
                        )}
                      </td>

                      {/* Target Qty */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                        {dashboardUtils.formatNumber(moItem.quantity, 2)}{' '}
                        <span className="text-[10px] text-gray-400 font-sans">
                          {moItem.unitOfMeasure || finishedProd.unitOfMeasure || 'pcs'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center">
                        <MOStatusBadge type="priority" value={moItem.priority} size="sm" />
                      </td>

                      {/* Stock Availability */}
                      <td className="py-3.5 px-4 text-center">
                        <MOStatusBadge type="availability" value={moItem.componentAvailabilityStatus} size="sm" />
                      </td>

                      {/* Execution Status */}
                      <td className="py-3.5 px-4 text-center">
                        <MOStatusBadge type="status" value={moItem.status} size="sm" />
                      </td>

                      {/* Planned Start */}
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                        {moItem.plannedStartDate ? new Date(moItem.plannedStartDate).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(moItem)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="View Manufacturing Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {moItem.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmOrder(moItem)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Confirm Order"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(moItem)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Planning"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {moItem.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStartOrder(moItem)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Start Execution"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {moItem.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleCompleteOrder(moItem)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Complete Order"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {['draft', 'confirmed', 'in_progress'].includes(moItem.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(moItem)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Order"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
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
        {!loading && orders.length > 0 && (
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
                Total <strong>{meta.total}</strong> production orders
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

      {/* Form Modal (Create / Edit) */}
      <ManufacturingOrderForm
        mo={selectedMoForForm}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Details Modal */}
      <ManufacturingOrderDetails
        moId={selectedMoIdForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(moItem) => {
          setIsDetailsOpen(false);
          handleOpenEditForm(moItem);
        }}
        onStatusChanged={() => fetchOrders(meta.page, meta.limit)}
      />
    </div>
  );
};

export default ManufacturingOrders;
