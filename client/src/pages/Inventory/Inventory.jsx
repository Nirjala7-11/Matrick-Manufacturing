import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import StockSummary from './components/StockSummary';
import StockLedgerTable from './components/StockLedgerTable';
import StockDetails from './StockDetails';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Boxes,
  Package,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  History,
  XCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
} from 'lucide-react';

import './Inventory.css';

export const Inventory = () => {
  // Active Tab View: 'products' | 'ledger'
  const [activeTab, setActiveTab] = useState('products');

  // Products State
  const [products, setProducts] = useState([]);
  const [productMeta, setProductMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Ledger State
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerMeta, setLedgerMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown Product List for Adjustments
  const [allProductsList, setAllProductsList] = useState([]);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [selectedProductIdForDetails, setSelectedProductIdForDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Global Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustTargetStock, setAdjustTargetStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

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

  // Fetch full products list for adjustment dropdown
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const baseUrl = endpoints?.products?.list || '/products';
        const res = await axios.get(baseUrl, { params: { limit: 100 } });
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.products)
          ? res.data.products
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setAllProductsList(list);
      } catch (err) {
        console.warn('Could not fetch products list for dropdowns:', err);
      }
    };
    fetchAllProducts();
  }, []);

  /**
   * Fetch Product Stock Catalog
   */
  const fetchProducts = useCallback(
    async (pageNum = productMeta.page, pageLimit = productMeta.limit) => {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: pageLimit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }

      try {
        const baseUrl = endpoints?.products?.list || '/products';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        let list = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.products)
          ? responseData.products
          : Array.isArray(responseData)
          ? responseData
          : [];

        // Apply client-side stock status filter if selected
        if (stockStatusFilter) {
          list = list.filter((p) => {
            const stock = p.stockOnHand || 0;
            const min = p.minStockLevel || 0;
            if (stockStatusFilter === 'out_of_stock') return stock <= 0;
            if (stockStatusFilter === 'low_stock') return stock > 0 && stock <= min;
            if (stockStatusFilter === 'in_stock') return stock > min;
            return true;
          });
        }

        setProducts(list);

        if (responseData?.meta) {
          setProductMeta({
            total: responseData.meta.total || list.length,
            page: responseData.meta.page || pageNum,
            limit: responseData.meta.limit || pageLimit,
            totalPages: responseData.meta.totalPages || 1,
          });
        } else {
          setProductMeta({
            total: list.length,
            page: pageNum,
            limit: pageLimit,
            totalPages: Math.ceil(list.length / pageLimit) || 1,
          });
        }
      } catch (err) {
        console.error('Error fetching inventory products:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load stock catalog.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, categoryFilter, stockStatusFilter, productMeta.page, productMeta.limit]
  );

  /**
   * Fetch Stock Ledger Entries
   */
  const fetchLedger = useCallback(
    async (pageNum = ledgerMeta.page, pageLimit = ledgerMeta.limit) => {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: pageLimit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (movementTypeFilter) {
        params.movementType = movementTypeFilter;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      try {
        const response = await axios.get('/stock-ledger', { params });
        const responseData = response?.data;
        const entries = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData)
          ? responseData
          : [];

        setLedgerEntries(entries);

        if (responseData?.meta) {
          setLedgerMeta({
            total: responseData.meta.total || entries.length,
            page: responseData.meta.page || pageNum,
            limit: responseData.meta.limit || pageLimit,
            totalPages: responseData.meta.totalPages || 1,
          });
        } else {
          setLedgerMeta({
            total: entries.length,
            page: pageNum,
            limit: pageLimit,
            totalPages: Math.ceil(entries.length / pageLimit) || 1,
          });
        }
      } catch (err) {
        console.error('Error fetching stock ledger:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load Stock Ledger entries.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, movementTypeFilter, startDate, endDate, ledgerMeta.page, ledgerMeta.limit]
  );

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts(1, productMeta.limit);
    } else {
      fetchLedger(1, ledgerMeta.limit);
    }
  }, [activeTab, debouncedSearch, categoryFilter, stockStatusFilter, movementTypeFilter, startDate, endDate]);

  const handlePageChange = (newPage) => {
    if (activeTab === 'products') {
      if (newPage >= 1 && newPage <= productMeta.totalPages) {
        fetchProducts(newPage, productMeta.limit);
      }
    } else {
      if (newPage >= 1 && newPage <= ledgerMeta.totalPages) {
        fetchLedger(newPage, ledgerMeta.limit);
      }
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    if (activeTab === 'products') {
      fetchProducts(1, newLimit);
    } else {
      fetchLedger(1, newLimit);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockStatusFilter('');
    setMovementTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  // Open Details Modal
  const handleOpenDetails = (prod) => {
    setSelectedProductIdForDetails(prod._id || prod.id);
    setIsDetailsOpen(true);
  };

  // Open Global Adjust Stock Modal
  const handleOpenAdjustModal = (product = null) => {
    if (product) {
      setAdjustProductId(product._id || product.id);
      setAdjustTargetStock((product.stockOnHand || 0).toString());
    } else {
      setAdjustProductId(allProductsList[0]?._id || allProductsList[0]?.id || '');
      setAdjustTargetStock('0');
    }
    setAdjustReason('');
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  // Submit Global Stock Adjustment
  const handleGlobalAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError(null);

    if (!adjustProductId) {
      setAdjustError('Please select a product to adjust.');
      return;
    }

    const targetVal = Number(adjustTargetStock);
    if (isNaN(targetVal) || targetVal < 0) {
      setAdjustError('Target stock on hand must be a non-negative number.');
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('A reason for the stock adjustment is required.');
      return;
    }

    setSubmittingAdjust(true);
    try {
      const payload = {
        productId: adjustProductId,
        newStockOnHand: targetVal,
        reason: adjustReason.trim(),
      };

      await axios.post('/stock-ledger/adjust', payload);

      showToastNotification('Stock adjustment executed successfully.');
      setIsAdjustModalOpen(false);

      if (activeTab === 'products') {
        fetchProducts(productMeta.page, productMeta.limit);
      } else {
        fetchLedger(ledgerMeta.page, ledgerMeta.limit);
      }
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setAdjustError(err?.response?.data?.message || 'Failed to adjust stock level.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Calculate high-level summary metrics from available products data
  const totalProductsCount = allProductsList.length || products.length;
  const totalUnitsOnHand = allProductsList.reduce((acc, p) => acc + (p.stockOnHand || 0), 0);
  const lowStockCount = allProductsList.filter(
    (p) => (p.stockOnHand || 0) <= (p.minStockLevel || 0) && (p.stockOnHand || 0) > 0
  ).length;
  const outOfStockCount = allProductsList.filter((p) => (p.stockOnHand || 0) <= 0).length;

  const currentMeta = activeTab === 'products' ? productMeta : ledgerMeta;

  return (
    <div className="mms-inventory-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
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
            <Boxes className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Inventory & Stock Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time material balances, finished goods inventory, and authoritative stock movement ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAdjustModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4" />
            <span>Manual Stock Adjustment</span>
          </button>

          <button
            type="button"
            onClick={() =>
              activeTab === 'products'
                ? fetchProducts(productMeta.page, productMeta.limit)
                : fetchLedger(ledgerMeta.page, ledgerMeta.limit)
            }
            className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-gray-700 transition-colors duration-150 cursor-pointer shadow-xs"
            title="Refresh Inventory Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Banner Cards */}
      <StockSummary
        totalProducts={totalProductsCount}
        totalStockOnHand={totalUnitsOnHand}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        totalMovements={ledgerMeta.total || ledgerEntries.length}
        loading={loading}
      />

      {/* View Toggle Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Stock Levels ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Global Stock Ledger History</span>
        </button>
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
            placeholder={
              activeTab === 'products'
                ? 'Search product name or SKU...'
                : 'Search ledger reason, reference...'
            }
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

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Filters:</span>
          </div>

          {activeTab === 'products' ? (
            <>
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
              >
                <option value="">All Categories</option>
                <option value="raw_material">Raw Material</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="component">Component</option>
                <option value="assembly">Assembly</option>
              </select>

              {/* Stock Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
              >
                <option value="">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock Alert</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </>
          ) : (
            <>
              {/* Movement Type Filter */}
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
              >
                <option value="">All Movement Types</option>
                <option value="FINISHED_GOODS_PRODUCTION">Finished Goods Production</option>
                <option value="RAW_MATERIAL_CONSUMPTION">Raw Material Consumption</option>
                <option value="IN">Stock Receipt (IN)</option>
                <option value="OUT">Stock Issue (OUT)</option>
                <option value="ADJUSTMENT">Manual Adjustment</option>
              </select>

              {/* Date Filters */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-lg px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs outline-none text-gray-700"
                  title="Start Date"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs outline-none text-gray-700"
                  title="End Date"
                />
              </div>
            </>
          )}

          {(searchTerm ||
            categoryFilter ||
            stockStatusFilter ||
            movementTypeFilter ||
            startDate ||
            endDate) && (
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
            onClick={() =>
              activeTab === 'products'
                ? fetchProducts(1, productMeta.limit)
                : fetchLedger(1, ledgerMeta.limit)
            }
            className="underline hover:text-red-900 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Data View */}
      {activeTab === 'products' ? (
        /* Product Stock Levels View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
              <p className="text-sm font-medium">Loading stock balances...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-800">No product inventory found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm || categoryFilter || stockStatusFilter
                  ? 'No inventory records match your selected search and filter criteria.'
                  : 'Products added in Product Master will appear here with live stock levels.'}
              </p>
              {(searchTerm || categoryFilter || stockStatusFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 px-4 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                    <th className="py-3.5 px-4">SKU / Code</th>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Unit</th>
                    <th className="py-3.5 px-4 text-right">Current Stock</th>
                    <th className="py-3.5 px-4 text-right">Min Threshold</th>
                    <th className="py-3.5 px-4 text-center">Stock Status</th>
                    <th className="py-3.5 px-4 text-right">Valuation</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {products.map((item) => {
                    const id = item._id || item.id;
                    const stock = item.stockOnHand || 0;
                    const min = item.minStockLevel || 0;

                    const isOutOfStock = stock <= 0;
                    const isLowStock = stock > 0 && stock <= min;
                    const valuation = stock * (item.costPrice || 0);

                    return (
                      <tr key={id} className="hover:bg-gray-50/80 transition-colors duration-150">
                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item)}
                            className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            {item.sku}
                          </button>
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div
                            className="font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors truncate max-w-[220px]"
                            onClick={() => handleOpenDetails(item)}
                          >
                            {item.name}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mms-cat-${item.category}`}
                          >
                            {dashboardUtils.formatStatus(item.category)}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono">
                          {item.unitOfMeasure || 'pcs'}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3.5 px-4 text-right font-bold font-mono text-sm text-gray-900">
                          {dashboardUtils.formatNumber(stock)}
                        </td>

                        {/* Min Threshold */}
                        <td className="py-3.5 px-4 text-right text-gray-500 font-mono">
                          {dashboardUtils.formatNumber(min)}
                        </td>

                        {/* Stock Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Out of Stock</span>
                              </>
                            ) : isLowStock ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Low Stock</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>In Stock</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Valuation */}
                        <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                          ${dashboardUtils.formatNumber(valuation, 2)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(item)}
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="View Stock Ledger History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(item)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Adjust Stock Level"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Global Stock Ledger History View */
        <StockLedgerTable
          entries={ledgerEntries}
          loading={loading}
          showProductColumn={true}
          onSelectEntry={(entry) => {
            if (entry.product) {
              const prodId = typeof entry.product === 'object' ? entry.product._id : entry.product;
              setSelectedProductIdForDetails(prodId);
              setIsDetailsOpen(true);
            }
          }}
        />
      )}

      {/* Pagination Footer */}
      {!loading && currentMeta.total > 0 && (
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl shadow-xs mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={currentMeta.limit}
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
              Total <strong>{currentMeta.total}</strong> records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">
              Page <strong>{currentMeta.page}</strong> of <strong>{currentMeta.totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentMeta.page <= 1}
                onClick={() => handlePageChange(currentMeta.page - 1)}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentMeta.page >= currentMeta.totalPages}
                onClick={() => handlePageChange(currentMeta.page + 1)}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Details Modal */}
      <StockDetails
        productId={selectedProductIdForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStockAdjusted={() => {
          if (activeTab === 'products') fetchProducts(productMeta.page, productMeta.limit);
          else fetchLedger(ledgerMeta.page, ledgerMeta.limit);
        }}
      />

      {/* Global Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>Manual Stock Adjustment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGlobalAdjustSubmit} className="p-5 space-y-4">
              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-medium">
                  {adjustError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => {
                    setAdjustProductId(e.target.value);
                    const found = allProductsList.find(
                      (p) => (p._id || p.id) === e.target.value
                    );
                    if (found) setAdjustTargetStock((found.stockOnHand || 0).toString());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {allProductsList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      [{p.sku}] {p.name} (Current: {p.stockOnHand || 0} {p.unitOfMeasure || 'pcs'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Stock On Hand *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={adjustTargetStock}
                  onChange={(e) => setAdjustTargetStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mandatory reason for audit log (e.g., Annual physical inventory reconciliation)..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingAdjust ? 'Adjusting...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
