import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import {
  Calendar,
  Filter,
  RotateCcw,
  Package,
  Factory,
  FileCheck,
  SlidersHorizontal,
  Layers,
  Search,
  AlertTriangle,
} from 'lucide-react';

/**
 * ReportFilters Component
 * Dynamic filter panel for manufacturing reports.
 * Exposes only query parameters supported by backend report parsers:
 * - startDate / endDate
 * - productId
 * - workCenterId
 * - manufacturingOrderId
 * - status
 * - movementType
 * - productType (raw materials / finished goods)
 */
export const ReportFilters = ({
  selectedReportId,
  filters,
  onApplyFilters,
  onResetFilters,
  loading = false,
}) => {
  // Form State
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [productId, setProductId] = useState(filters.productId || '');
  const [workCenterId, setWorkCenterId] = useState(filters.workCenterId || '');
  const [manufacturingOrderId, setManufacturingOrderId] = useState(
    filters.manufacturingOrderId || ''
  );
  const [status, setStatus] = useState(filters.status || '');
  const [movementType, setMovementType] = useState(filters.movementType || '');
  const [productTypeFilter, setProductTypeFilter] = useState(
    filters.productTypeFilter || 'all'
  );

  const [activePreset, setActivePreset] = useState('30d');
  const [validationError, setValidationError] = useState('');

  // Dropdown Lists State
  const [productList, setProductList] = useState([]);
  const [workCenterList, setWorkCenterList] = useState([]);
  const [moList, setMoList] = useState([]);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  // Sync state on report change or incoming filters change
  useEffect(() => {
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    setProductId(filters.productId || '');
    setWorkCenterId(filters.workCenterId || '');
    setManufacturingOrderId(filters.manufacturingOrderId || '');
    setStatus(filters.status || '');
    setMovementType(filters.movementType || '');
    setProductTypeFilter(filters.productTypeFilter || 'all');
    setValidationError('');
  }, [filters, selectedReportId]);

  // Fetch Master Data dropdown lists (Products, Work Centers, MOs)
  useEffect(() => {
    const fetchMasterData = async () => {
      setFetchingDropdowns(true);
      try {
        const prodEndpoint = endpoints?.products?.list || '/products';
        const wcEndpoint = endpoints?.workCenters?.list || '/work-centers';
        const moEndpoint = '/manufacturing-orders';

        const [prodRes, wcRes, moRes] = await Promise.allSettled([
          axios.get(prodEndpoint, { params: { limit: 100 } }),
          axios.get(wcEndpoint, { params: { limit: 100 } }),
          axios.get(moEndpoint, { params: { limit: 100 } }),
        ]);

        if (prodRes.status === 'fulfilled') {
          const raw = prodRes.value?.data;
          const list = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.products)
            ? raw.products
            : Array.isArray(raw)
            ? raw
            : [];
          setProductList(list);
        }

        if (wcRes.status === 'fulfilled') {
          const raw = wcRes.value?.data;
          const list = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.workCenters)
            ? raw.workCenters
            : Array.isArray(raw)
            ? raw
            : [];
          setWorkCenterList(list);
        }

        if (moRes.status === 'fulfilled') {
          const raw = moRes.value?.data;
          const list = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.orders)
            ? raw.orders
            : Array.isArray(raw)
            ? raw
            : [];
          setMoList(list);
        }
      } catch (err) {
        console.warn('Error fetching report filter master data:', err);
      } finally {
        setFetchingDropdowns(false);
      }
    };

    fetchMasterData();
  }, []);

  // Quick Preset Handlers
  const handleApplyPreset = (days) => {
    setActivePreset(`${days}d`);
    setValidationError('');
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);

    onApplyFilters({
      startDate: startStr,
      endDate: endStr,
      productId,
      workCenterId,
      manufacturingOrderId,
      status,
      movementType,
      productTypeFilter,
    });
  };

  const handleYtdPreset = () => {
    setActivePreset('ytd');
    setValidationError('');
    const end = new Date();
    const start = new Date(end.getFullYear(), 0, 1);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);

    onApplyFilters({
      startDate: startStr,
      endDate: endStr,
      productId,
      workCenterId,
      manufacturingOrderId,
      status,
      movementType,
      productTypeFilter,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // Frontend Date Range Validation
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setValidationError('Start date cannot be after end date.');
      return;
    }

    // Product Type translation for product-stock report
    let isRawMaterial;
    let isFinishedGood;
    if (productTypeFilter === 'raw') {
      isRawMaterial = 'true';
    } else if (productTypeFilter === 'finished') {
      isFinishedGood = 'true';
    }

    onApplyFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      productId: productId || undefined,
      workCenterId: workCenterId || undefined,
      manufacturingOrderId: manufacturingOrderId || undefined,
      status: status || undefined,
      movementType: movementType || undefined,
      productTypeFilter,
      isRawMaterial,
      isFinishedGood,
    });
  };

  const handleReset = () => {
    setActivePreset('30d');
    setValidationError('');
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setProductId('');
    setWorkCenterId('');
    setManufacturingOrderId('');
    setStatus('');
    setMovementType('');
    setProductTypeFilter('all');

    onResetFilters();
  };

  const showDateFilters = selectedReportId !== 'product-stock';
  const showProductFilter = true;
  const showWorkCenterFilter =
    selectedReportId === 'work-orders' || selectedReportId === 'manufacturing-orders';
  const showMoFilter =
    selectedReportId === 'throughput' ||
    selectedReportId === 'work-orders' ||
    selectedReportId === 'stock-ledger';
  const showStatusFilter =
    selectedReportId === 'manufacturing-orders' || selectedReportId === 'work-orders';
  const showMovementTypeFilter = selectedReportId === 'stock-ledger';
  const showProductTypeFilter = selectedReportId === 'product-stock';

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Filter Title Bar & Quick Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Report Parameters & Filters
            </h2>
          </div>

          {showDateFilters && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-gray-400 font-semibold mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset(7)}
                className={`mms-analytics-preset-btn ${
                  activePreset === '7d' ? 'active' : ''
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(30)}
                className={`mms-analytics-preset-btn ${
                  activePreset === '30d' ? 'active' : ''
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(90)}
                className={`mms-analytics-preset-btn ${
                  activePreset === '90d' ? 'active' : ''
                }`}
              >
                90 Days
              </button>
              <button
                type="button"
                onClick={handleYtdPreset}
                className={`mms-analytics-preset-btn ${
                  activePreset === 'ytd' ? 'active' : ''
                }`}
              >
                YTD
              </button>
            </div>
          )}
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Start Date */}
          {showDateFilters && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/30"
                />
              </div>
            </div>
          )}

          {/* End Date */}
          {showDateFilters && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                End Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/30"
                />
              </div>
            </div>
          )}

          {/* Product Filter */}
          {showProductFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Product
              </label>
              <div className="relative">
                <Package className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={fetchingDropdowns}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="">All Products</option>
                  {productList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Work Center Filter */}
          {showWorkCenterFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Work Center
              </label>
              <div className="relative">
                <Factory className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={workCenterId}
                  onChange={(e) => setWorkCenterId(e.target.value)}
                  disabled={fetchingDropdowns}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="">All Work Centers</option>
                  {workCenterList.map((wc) => (
                    <option key={wc._id || wc.id} value={wc._id || wc.id}>
                      [{wc.code}] {wc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Manufacturing Order Filter */}
          {showMoFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Manufacturing Order
              </label>
              <div className="relative">
                <FileCheck className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={manufacturingOrderId}
                  onChange={(e) => setManufacturingOrderId(e.target.value)}
                  disabled={fetchingDropdowns}
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="">All Orders</option>
                  {moList.map((mo) => (
                    <option key={mo._id || mo.id} value={mo._id || mo.id}>
                      {mo.moNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          {/* Movement Type Filter */}
          {showMovementTypeFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Movement Type
              </label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="">All Movement Types</option>
                <option value="FINISHED_GOODS_PRODUCTION">
                  Finished Goods Production
                </option>
                <option value="RAW_MATERIAL_CONSUMPTION">
                  Raw Material Consumption
                </option>
                <option value="INITIAL_STOCK">Initial Stock Setup</option>
                <option value="MANUAL_ADJUSTMENT">Manual Stock Adjustment</option>
              </select>
            </div>
          )}

          {/* Product Type Filter (Product Stock) */}
          {showProductTypeFilter && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Product Classification
              </label>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="all">All Catalog Items</option>
                <option value="finished">Finished Goods Only</option>
                <option value="raw">Raw Materials Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 font-mono">
            <span>Filter criteria applied directly to backend report generators</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Filter className={`w-3.5 h-3.5 ${loading ? 'mms-spinner-animate' : ''}`} />
              <span>{loading ? 'Generating...' : 'Apply & Preview'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportFilters;
