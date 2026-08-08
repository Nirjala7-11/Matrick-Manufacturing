import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Power,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Boxes,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

import './Products.css';

export const Products = () => {
  // Data States
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProductForForm, setSelectedProductForForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProductIdForDetails, setSelectedProductIdForDetails] = useState(null);

  // Debounce search term changes
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

  /**
   * Fetch Products from API with filtering, searching, and pagination
   */
  const fetchProducts = useCallback(
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
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      if (statusFilter !== '') {
        params.isActive = statusFilter === 'true';
      }

      try {
        const baseUrl = endpoints?.products?.list || '/products';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        const productsList = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.products)
          ? responseData.products
          : Array.isArray(responseData)
          ? responseData
          : [];

        setProducts(productsList);

        if (responseData?.meta) {
          setMeta({
            total: responseData.meta.total || productsList.length,
            page: responseData.meta.page || pageNum,
            limit: responseData.meta.limit || pageLimit,
            totalPages: responseData.meta.totalPages || 1,
          });
        } else {
          setMeta({
            total: productsList.length,
            page: pageNum,
            limit: pageLimit,
            totalPages: Math.ceil(productsList.length / pageLimit) || 1,
          });
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err?.response?.data?.message || err?.message || 'Error loading product master catalog.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, categoryFilter, statusFilter, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchProducts(1, meta.limit);
  }, [debouncedSearch, categoryFilter, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchProducts(newPage, meta.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    fetchProducts(1, newLimit);
  };

  // Status Toggle Handler (Soft Activation/Deactivation)
  const handleToggleStatus = async (product) => {
    const id = product._id || product.id;
    const newStatus = !product.isActive;
    const actionText = newStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionText} product "${product.name}" (${product.sku})?`)) {
      return;
    }

    try {
      const baseUrl = endpoints?.products?.list || '/products';
      const statusUrl = endpoints?.products?.toggleStatus
        ? endpoints.products.toggleStatus(id)
        : `${baseUrl}/${id}/status`;

      await axios.patch(statusUrl, { isActive: newStatus });

      showToastNotification(
        `Product "${product.sku}" has been ${newStatus ? 'activated' : 'deactivated'}.`
      );
      fetchProducts(meta.page, meta.limit);
    } catch (err) {
      console.error('Error updating product status:', err);
      showToastNotification(
        err?.response?.data?.message || 'Failed to update product status.',
        'error'
      );
    }
  };

  // Modal Handlers
  const handleOpenCreateForm = () => {
    setSelectedProductForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product) => {
    setSelectedProductForForm(product);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (product) => {
    setSelectedProductIdForDetails(product._id || product.id);
    setIsDetailsOpen(true);
  };

  const handleFormSuccess = (savedProduct, actionType) => {
    showToastNotification(
      `Product "${savedProduct.sku || savedProduct.name}" successfully ${actionType}.`
    );
    fetchProducts(meta.page, meta.limit);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  return (
    <div className="mms-products-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
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

      {/* Header & Title Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Product Master</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Maintain raw materials, components, assemblies, and finished goods specifications
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/30"
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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          >
            <option value="">All Categories</option>
            <option value="raw_material">Raw Material</option>
            <option value="finished_goods">Finished Goods</option>
            <option value="component">Component</option>
            <option value="assembly">Assembly</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(categoryFilter || statusFilter || searchTerm) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchProducts(meta.page, meta.limit)}
            className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
            title="Refresh table"
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
            onClick={() => fetchProducts(1, meta.limit)}
            className="underline hover:text-red-900 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Product Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading products catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No products found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch || categoryFilter || statusFilter
                ? 'No product items match your current search and filter settings.'
                : 'Get started by creating your first product master record.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(debouncedSearch || categoryFilter || statusFilter) && (
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
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Add Product
              </button>
            </div>
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
                  <th className="py-3.5 px-4 text-right">Stock on Hand</th>
                  <th className="py-3.5 px-4 text-right">Min Stock</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {products.map((item) => {
                  const id = item._id || item.id;
                  const isLowStock =
                    typeof item.stockOnHand === 'number' &&
                    typeof item.minStockLevel === 'number' &&
                    item.stockOnHand <= item.minStockLevel;

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-gray-50/80 transition-colors duration-150 ${
                        !item.isActive ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{item.sku}</td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div
                          className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate max-w-[220px]"
                          onClick={() => handleOpenDetails(item)}
                        >
                          {item.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mms-cat-${item.category}`}
                        >
                          {dashboardUtils.formatStatus(item.category)}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-gray-600 font-mono">{item.unitOfMeasure || 'pcs'}</td>

                      {/* Stock on Hand */}
                      <td className="py-3 px-4 text-right font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isLowStock ? 'mms-stock-low font-extrabold' : 'mms-stock-normal'
                          }`}
                        >
                          {dashboardUtils.formatNumber(item.stockOnHand)}
                        </span>
                      </td>

                      {/* Min Stock Level */}
                      <td className="py-3 px-4 text-right text-gray-500">
                        {dashboardUtils.formatNumber(item.minStockLevel)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right text-gray-700 font-mono">
                        ${dashboardUtils.formatNumber(item.costPrice, 2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right text-gray-900 font-bold font-mono">
                        ${dashboardUtils.formatNumber(item.sellingPrice, 2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            item.isActive ? 'mms-status-active' : 'mms-status-inactive'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Product Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(item)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isActive
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.isActive ? 'Deactivate Product' : 'Activate Product'}
                          >
                            <Power className="w-3.5 h-3.5" />
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
        {!loading && products.length > 0 && (
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
                Total <strong>{meta.total}</strong> products
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

      {/* Product Form Modal (Create & Edit) */}
      <ProductForm
        product={selectedProductForForm}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Product Details Modal */}
      <ProductDetails
        productId={selectedProductIdForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(prod) => {
          setIsDetailsOpen(false);
          handleOpenEditForm(prod);
        }}
      />
    </div>
  );
};

export default Products;
