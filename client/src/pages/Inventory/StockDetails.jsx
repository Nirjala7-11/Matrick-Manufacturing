import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import StockLedgerTable from './components/StockLedgerTable';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  X,
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Sliders,
  History,
  Tag,
  Layers,
} from 'lucide-react';

/**
 * StockDetails - Slide-over / Modal displaying current stock position and full Stock Ledger movement history for a selected product.
 */
export const StockDetails = ({
  productId,
  isOpen,
  onClose,
  onStockAdjusted,
}) => {
  const [product, setProduct] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Manual Adjustment Form States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetStock, setAdjustTargetStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  const fetchStockData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Product details
      const prodUrl = endpoints?.products?.getById
        ? endpoints.products.getById(productId)
        : `/products/${productId}`;
      
      const prodRes = await axios.get(prodUrl);
      const prodData = prodRes?.data?.data || prodRes?.data?.product || prodRes?.data;
      setProduct(prodData);

      // 2. Fetch stock info summary
      try {
        const stockRes = await axios.get(`/stock-ledger/stock/${productId}`);
        setStockInfo(stockRes?.data?.data || null);
      } catch (err) {
        console.warn('Could not load stock summary endpoint:', err);
      }

      // 3. Fetch product stock ledger movement history
      setHistoryLoading(true);
      const ledgerRes = await axios.get(`/stock-ledger/product/${productId}`);
      const entries = Array.isArray(ledgerRes?.data?.data)
        ? ledgerRes.data.data
        : Array.isArray(ledgerRes?.data)
        ? ledgerRes.data
        : [];
      setLedgerEntries(entries);
    } catch (err) {
      console.error('Error fetching stock details:', err);
      setError(err?.response?.data?.message || 'Failed to load product stock details.');
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchStockData();
    }
  }, [isOpen, productId, fetchStockData]);

  // Handle stock adjustment submission
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError(null);

    const targetVal = Number(adjustTargetStock);
    if (isNaN(targetVal) || targetVal < 0) {
      setAdjustError('New stock on hand must be a non-negative number.');
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('A reason for the stock adjustment is required.');
      return;
    }

    setSubmittingAdjust(true);
    try {
      const payload = {
        productId,
        newStockOnHand: targetVal,
        reason: adjustReason.trim(),
      };

      await axios.post('/stock-ledger/adjust', payload);

      setShowAdjustModal(false);
      setAdjustReason('');
      setAdjustTargetStock('');
      
      fetchStockData();
      if (onStockAdjusted) onStockAdjusted();
    } catch (err) {
      console.error('Error performing stock adjustment:', err);
      setAdjustError(err?.response?.data?.message || 'Failed to perform stock adjustment.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  if (!isOpen) return null;

  const currentStock = typeof stockInfo?.stockOnHand === 'number'
    ? stockInfo.stockOnHand
    : typeof product?.stockOnHand === 'number'
    ? product.stockOnHand
    : 0;

  const minStock = typeof stockInfo?.minStockLevel === 'number'
    ? stockInfo.minStockLevel
    : typeof product?.minStockLevel === 'number'
    ? product.minStockLevel
    : 0;

  const isLowStock = currentStock <= minStock && currentStock > 0;
  const isOutOfStock = currentStock <= 0;
  const stockValuation = currentStock * (product?.costPrice || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gray-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-white">
                  {product?.sku || 'SKU'}
                </span>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] uppercase font-mono font-bold">
                  {product?.category ? dashboardUtils.formatStatus(product.category) : 'Product'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-gray-200 mt-0.5">
                {product?.name || 'Loading product...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStockData}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Refresh stock data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchStockData} className="underline font-bold">
                Retry
              </button>
            </div>
          )}

          {/* Current Stock Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Stock On Hand */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Stock On Hand</span>
                <Boxes className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-gray-900">
                  {dashboardUtils.formatNumber(currentStock)}{' '}
                  <span className="text-xs text-gray-500 font-sans">{product?.unitOfMeasure || 'pcs'}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isOutOfStock
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isLowStock
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Out of Stock</span>
                    </>
                  ) : isLowStock ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Low Stock</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>In Stock</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Min Stock Level */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Min Stock Level</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-800">
                {dashboardUtils.formatNumber(minStock)}{' '}
                <span className="text-xs text-gray-500 font-sans">{product?.unitOfMeasure || 'pcs'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Reorder threshold for material planning</p>
            </div>

            {/* Total Stock Valuation */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Stock Valuation</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
                ${dashboardUtils.formatNumber(stockValuation, 2)}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Cost Basis: ${dashboardUtils.formatNumber(product?.costPrice || 0, 2)} / unit
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Inventory Control Actions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Perform manual stock adjustments with mandatory audit trail reasons
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdjustTargetStock(currentStock.toString());
                setAdjustError(null);
                setShowAdjustModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Adjust Stock Level</span>
            </button>
          </div>

          {/* Stock Adjustment Form Modal / Inline Box */}
          {showAdjustModal && (
            <div className="bg-purple-50/80 border border-purple-200 p-5 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3 border-b border-purple-200 pb-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Manual Stock Adjustment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              {adjustError && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-xs mb-3 font-medium">
                  {adjustError}
                </div>
              )}

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      New Stock On Hand ({product?.unitOfMeasure || 'pcs'}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={adjustTargetStock}
                      onChange={(e) => setAdjustTargetStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Adjustment Reason *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physical inventory count discrepancy, damage write-off..."
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdjust}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAdjust ? 'Applying Adjustment...' : 'Confirm Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stock Movement History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-900">Stock Ledger Movement History</h3>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {ledgerEntries.length} movements recorded
              </span>
            </div>

            <StockLedgerTable
              entries={ledgerEntries}
              loading={historyLoading}
              showProductColumn={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
