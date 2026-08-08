import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import {
  X,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit,
  DollarSign,
  Layers,
  Clock,
  Boxes,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

export const ProductDetails = ({ productId, isOpen, onClose, onEdit }) => {
  const [product, setProduct] = useState(null);
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setProduct(null);
      setBom(null);

      try {
        const baseUrl = endpoints?.products?.list || '/products';
        const productUrl = endpoints?.products?.getById
          ? endpoints.products.getById(productId)
          : `${baseUrl}/${productId}`;

        const productRes = await axios.get(productUrl);
        const prodData = productRes?.data?.data || productRes?.data;
        setProduct(prodData);

        // Fetch associated active BOM for this product if endpoint exists
        try {
          const bomEndpoint = endpoints?.boms?.getByProduct
            ? endpoints.boms.getByProduct(productId)
            : `/boms/product/${productId}`;
          const bomRes = await axios.get(bomEndpoint);
          setBom(bomRes?.data?.data || bomRes?.data || null);
        } catch (bomErr) {
          // If 404, product has no active BOM, which is normal
          setBom(null);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId, isOpen]);

  if (!isOpen) return null;

  const isLowStock =
    product &&
    typeof product.stockOnHand === 'number' &&
    typeof product.minStockLevel === 'number' &&
    product.stockOnHand <= product.minStockLevel;

  const cost = product?.costPrice || 0;
  const price = product?.sellingPrice || 0;
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

  return (
    <div className="mms-modal-overlay" onClick={onClose}>
      <div className="mms-modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{product?.name || 'Product Details'}</h2>
                {product?.sku && (
                  <span className="px-2 py-0.5 font-mono text-xs font-bold bg-gray-200 text-gray-700 rounded">
                    {product.sku}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Product Master & Inventory Record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading product details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" /> Error Loading Product
              </div>
              <p>{error}</p>
            </div>
          ) : product ? (
            <>
              {/* Status and Category Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Category:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] mms-cat-${product.category}`}
                  >
                    {dashboardUtils.formatStatus(product.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      product.isActive ? 'mms-status-active' : 'mms-status-inactive'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Stock Inventory Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isLowStock ? 'bg-amber-50/80 border-amber-200' : 'bg-blue-50/50 border-blue-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Boxes className={`w-5 h-5 ${isLowStock ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                      Current Stock on Hand
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {dashboardUtils.formatNumber(product.stockOnHand)} {product.unitOfMeasure || 'pcs'}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-gray-500 block">Min Stock Level</span>
                  <span className="font-bold text-gray-800">
                    {dashboardUtils.formatNumber(product.minStockLevel)} {product.unitOfMeasure || 'pcs'}
                  </span>
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Financials & Pricing Grid */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Commercial & Costing
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Cost Price</span>
                    <span className="text-sm font-bold text-gray-900">${dashboardUtils.formatNumber(cost, 2)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Selling Price</span>
                    <span className="text-sm font-bold text-gray-900">${dashboardUtils.formatNumber(price, 2)}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-emerald-700 block font-medium">Profit Margin</span>
                    <span className="text-sm font-bold text-emerald-900">
                      {margin > 0 ? `${margin.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> Description & Specifications
                </h3>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed min-h-[60px]">
                  {product.description || <span className="text-gray-400 italic">No description provided for this product.</span>}
                </div>
              </div>

              {/* Associated Bill of Materials (BOM) */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" /> Bill of Materials (BOM)
                </h3>
                {bom ? (
                  <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-purple-950">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>{bom.bomNumber || bom.code || 'BOM Active'}</span>
                        <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-mono">
                          Rev {bom.revision || '1.0'}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700 mt-1">
                        Contains {bom.components?.length || 0} component(s) & {bom.operations?.length || 0} operation step(s)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Active BOM
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 text-center">
                    No active Bill of Materials registered for this product.
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
                <span>Created: {dashboardUtils.formatDate(product.createdAt, true)}</span>
                <span>Updated: {dashboardUtils.formatDate(product.updatedAt, true)}</span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          {product && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
