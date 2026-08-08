import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import BOMForm from './BOMForm';
import BOMDetails from './BOMDetails';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Power,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Boxes,
  Cpu,
  Package,
} from 'lucide-react';

import './BOMs.css';

export const BOMs = () => {
  // Data States
  const [boms, setBoms] = useState([]);
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
  const [productFilter, setProductFilter] = useState('');

  // Dropdown list for product filter
  const [productsList, setProductsList] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBomForForm, setSelectedBomForForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBomIdForDetails, setSelectedBomIdForDetails] = useState(null);

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
   * Fetch BOMs list with pagination, search, and filters
   */
  const fetchBOMs = useCallback(
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
      if (statusFilter !== '') {
        params.isActive = statusFilter;
      }
      if (productFilter) {
        params.finishedProduct = productFilter;
      }

      try {
        const baseUrl = endpoints?.boms?.list || '/boms';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        const list = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.boms)
          ? responseData.boms
          : Array.isArray(responseData)
          ? responseData
          : [];

        setBoms(list);

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
        console.error('Error fetching BOMs list:', err);
        setError(err?.response?.data?.message || err?.message || 'Error loading Bill of Materials directory.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, productFilter, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchBOMs(1, meta.limit);
  }, [debouncedSearch, statusFilter, productFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchBOMs(newPage, meta.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    fetchBOMs(1, newLimit);
  };

  // Toggle Active/Inactive Status Handler
  const handleToggleStatus = async (bomItem) => {
    const id = bomItem._id || bomItem.id;
    const currentActive = bomItem.isActive;
    const newActive = !currentActive;

    if (
      !window.confirm(
        `Are you sure you want to ${newActive ? 'activate' : 'deactivate'} BOM "${bomItem.code}"?`
      )
    ) {
      return;
    }

    try {
      const baseUrl = endpoints?.boms?.list || '/boms';
      const statusUrl = endpoints?.boms?.toggleStatus
        ? endpoints.boms.toggleStatus(id)
        : `${baseUrl}/${id}/status`;

      await axios.patch(statusUrl, { isActive: newActive });

      showToastNotification(`BOM "${bomItem.code}" status changed to ${newActive ? 'Active' : 'Inactive'}.`);
      fetchBOMs(meta.page, meta.limit);
    } catch (err) {
      console.error('Error toggling BOM status:', err);
      showToastNotification(err?.response?.data?.message || 'Failed to update BOM status.', 'error');
    }
  };

  // Delete BOM Handler
  const handleDeleteBOM = async (bomItem) => {
    const id = bomItem._id || bomItem.id;

    if (
      !window.confirm(
        `Are you sure you want to permanently delete BOM "${bomItem.code}"?\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const baseUrl = endpoints?.boms?.list || '/boms';
      const deleteUrl = endpoints?.boms?.delete
        ? endpoints.boms.delete(id)
        : `${baseUrl}/${id}`;

      await axios.delete(deleteUrl);

      showToastNotification(`BOM "${bomItem.code}" deleted successfully.`);
      fetchBOMs(meta.page, meta.limit);
    } catch (err) {
      console.error('Error deleting BOM:', err);
      showToastNotification(
        err?.response?.data?.message || 'Cannot delete BOM. It may be referenced by active orders.',
        'error'
      );
    }
  };

  // Modal Handlers
  const handleOpenCreateForm = () => {
    setSelectedBomForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (bomItem) => {
    setSelectedBomForForm(bomItem);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (bomItem) => {
    setSelectedBomIdForDetails(bomItem._id || bomItem.id);
    setIsDetailsOpen(true);
  };

  const handleFormSuccess = (savedBOM, actionType) => {
    showToastNotification(
      `BOM "${savedBOM.code || 'Item'}" successfully ${actionType}.`
    );
    fetchBOMs(meta.page, meta.limit);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setProductFilter('');
  };

  // Banner metrics
  const activeCount = boms.filter((b) => b.isActive).length;
  const totalComponentsCount = boms.reduce((sum, b) => sum + (b.components?.length || 0), 0);
  const totalOperationsCount = boms.reduce((sum, b) => sum + (b.operations?.length || 0), 0);

  return (
    <div className="mms-boms-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
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
              Bill of Materials (BOM)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage product manufacturing formulas, multi-level component demands, and work center routings
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New BOM</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total BOM Formulas</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">{meta.total}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Released</span>
            <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Component Links</span>
            <span className="text-2xl font-bold text-blue-700 mt-0.5 block">{totalComponentsCount}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Routing Steps</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">{totalOperationsCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Cpu className="w-5 h-5" />
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
            placeholder="Search BOM by code or product..."
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
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white max-w-[180px] truncate"
          >
            <option value="">All Output Products</option>
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
            <option value="true">Active Only</option>
            <option value="false">Inactive / Archived</option>
          </select>

          {(statusFilter !== '' || searchTerm || productFilter) && (
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
            onClick={() => fetchBOMs(meta.page, meta.limit)}
            className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
            title="Refresh directory"
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
            onClick={() => fetchBOMs(1, meta.limit)}
            className="underline hover:text-red-900 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* BOM Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading Bills of Materials...</p>
          </div>
        ) : boms.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Layers className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No bills of materials found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch || statusFilter || productFilter
                ? 'No BOM specifications match your search or filter criteria.'
                : 'Get started by creating your first manufacturing Bill of Materials.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(debouncedSearch || statusFilter || productFilter) && (
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
                Add New BOM
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                  <th className="py-3.5 px-4">BOM Code</th>
                  <th className="py-3.5 px-4">Finished Product</th>
                  <th className="py-3.5 px-4 text-center">Version</th>
                  <th className="py-3.5 px-4 text-right">Base Output</th>
                  <th className="py-3.5 px-4 text-center">Components</th>
                  <th className="py-3.5 px-4 text-center">Operations</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {boms.map((bomItem) => {
                  const id = bomItem._id || bomItem.id;
                  const finishedProd =
                    typeof bomItem.finishedProduct === 'object' ? bomItem.finishedProduct : {};

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-gray-50/80 transition-colors duration-150 ${
                        !bomItem.isActive ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                          {bomItem.code}
                        </span>
                      </td>

                      {/* Finished Product */}
                      <td className="py-3.5 px-4">
                        <div
                          className="font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors truncate max-w-[220px]"
                          onClick={() => handleOpenDetails(bomItem)}
                        >
                          {finishedProd.name || 'Unknown Product'}
                        </div>
                        {finishedProd.sku && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            SKU: {finishedProd.sku}
                          </span>
                        )}
                      </td>

                      {/* Version */}
                      <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                        v{bomItem.version || '1.0'}
                      </td>

                      {/* Output Qty */}
                      <td className="py-3.5 px-4 text-right font-bold text-gray-800 font-mono">
                        {dashboardUtils.formatNumber(bomItem.quantity, 2)}{' '}
                        <span className="text-[10px] text-gray-400 font-sans">
                          {finishedProd.unitOfMeasure || 'pcs'}
                        </span>
                      </td>

                      {/* Component Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {bomItem.components?.length || 0} Item(s)
                        </span>
                      </td>

                      {/* Operation Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {bomItem.operations?.length || 0} Step(s)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            bomItem.isActive ? 'mms-bom-status-active' : 'mms-bom-status-inactive'
                          }`}
                        >
                          {bomItem.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1 text-red-600" /> Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(bomItem)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="View BOM Specification"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(bomItem)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit BOM Formula"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(bomItem)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              bomItem.isActive
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={bomItem.isActive ? 'Archive / Deactivate' : 'Activate BOM'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBOM(bomItem)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete BOM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {!loading && boms.length > 0 && (
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
                Total <strong>{meta.total}</strong> BOM specifications
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

      {/* BOM Form Modal (Create & Edit) */}
      <BOMForm
        bom={selectedBomForForm}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* BOM Details Modal */}
      <BOMDetails
        bomId={selectedBomIdForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(bomItem) => {
          setIsDetailsOpen(false);
          handleOpenEditForm(bomItem);
        }}
      />
    </div>
  );
};

export default BOMs;
