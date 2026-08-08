import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import {
  Calendar,
  Filter,
  Package,
  Factory,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const AnalyticsFilters = ({
  filters,
  onApplyFilters,
  onResetFilters,
  onExportExcel,
  onExportPDF,
  loading = false,
}) => {
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [productId, setProductId] = useState(filters.productId || '');
  const [workCenterId, setWorkCenterId] = useState(filters.workCenterId || '');
  const [activePreset, setActivePreset] = useState(filters.preset || 'monthly');

  const [productList, setProductList] = useState([]);
  const [workCenterList, setWorkCenterList] = useState([]);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  useEffect(() => {
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    setProductId(filters.productId || '');
    setWorkCenterId(filters.workCenterId || '');
  }, [filters]);

  useEffect(() => {
    const fetchMasterLists = async () => {
      setFetchingDropdowns(true);
      try {
        const prodEndpoint = endpoints?.products?.list || '/products';
        const wcEndpoint = endpoints?.workCenters?.list || '/work-centers';

        const [prodRes, wcRes] = await Promise.allSettled([
          axios.get(prodEndpoint, { params: { limit: 100 } }),
          axios.get(wcEndpoint, { params: { limit: 100 } }),
        ]);

        if (prodRes.status === 'fulfilled') {
          const rawProds = prodRes.value?.data;
          const list = Array.isArray(rawProds?.data)
            ? rawProds.data
            : Array.isArray(rawProds?.products)
            ? rawProds.products
            : Array.isArray(rawProds)
            ? rawProds
            : [];
          setProductList(list);
        }

        if (wcRes.status === 'fulfilled') {
          const rawWcs = wcRes.value?.data;
          const list = Array.isArray(rawWcs?.data)
            ? rawWcs.data
            : Array.isArray(rawWcs?.workCenters)
            ? rawWcs.workCenters
            : Array.isArray(rawWcs)
            ? rawWcs
            : [];
          setWorkCenterList(list);
        }
      } catch (err) {
        console.warn('Error loading filter dropdown data:', err);
      } finally {
        setFetchingDropdowns(false);
      }
    };

    fetchMasterLists();
  }, []);

  // Preset Handlers (Weekly, Monthly, 3-Monthly, Quarterly, Yearly)
  const handlePresetSelect = (presetKey, days) => {
    setActivePreset(presetKey);
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
      preset: presetKey,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setActivePreset('custom');
    onApplyFilters({
      startDate,
      endDate,
      productId: productId || undefined,
      workCenterId: workCenterId || undefined,
      preset: 'custom',
    });
  };

  const handleReset = () => {
    setActivePreset('monthly');
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setProductId('');
    setWorkCenterId('');

    onResetFilters();
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Control Bar: Title, Presets & Export Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Analytics Time Period & Scope
            </h2>
          </div>

          {/* Presets: Weekly, Monthly, 3-Monthly, Quarterly, Yearly */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Time Filter:</span>
            <button
              type="button"
              onClick={() => handlePresetSelect('weekly', 7)}
              className={`mms-analytics-preset-btn ${activePreset === 'weekly' ? 'active font-bold bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} text-xs px-2.5 py-1 rounded-lg transition-colors`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('monthly', 30)}
              className={`mms-analytics-preset-btn ${activePreset === 'monthly' ? 'active font-bold bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} text-xs px-2.5 py-1 rounded-lg transition-colors`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('3-monthly', 90)}
              className={`mms-analytics-preset-btn ${activePreset === '3-monthly' ? 'active font-bold bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} text-xs px-2.5 py-1 rounded-lg transition-colors`}
            >
              3-Monthly
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('quarterly', 120)}
              className={`mms-analytics-preset-btn ${activePreset === 'quarterly' ? 'active font-bold bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} text-xs px-2.5 py-1 rounded-lg transition-colors`}
            >
              Quarterly
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('yearly', 365)}
              className={`mms-analytics-preset-btn ${activePreset === 'yearly' ? 'active font-bold bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} text-xs px-2.5 py-1 rounded-lg transition-colors`}
            >
              Yearly
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              End Date
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Product Category
            </label>
            <div className="relative">
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={fetchingDropdowns}
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="">All Finished Products</option>
                {productList.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    [{p.sku}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Work Center Station
            </label>
            <div className="relative">
              <Factory className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={workCenterId}
                onChange={(e) => setWorkCenterId(e.target.value)}
                disabled={fetchingDropdowns}
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="">All Shop Floor Work Centers</option>
                {workCenterList.map((wc) => (
                  <option key={wc._id || wc.id} value={wc._id || wc.id}>
                    [{wc.code}] {wc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-mono">
            Active Filter: <span className="font-bold text-blue-600 uppercase">{activePreset}</span> window ({startDate} to {endDate})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Filter className={`w-3.5 h-3.5 ${loading ? 'mms-spinner-animate' : ''}`} />
              <span>{loading ? 'Updating...' : 'Apply Scope'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnalyticsFilters;
