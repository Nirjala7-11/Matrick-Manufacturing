import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import {
  Factory,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Package,
  Hash,
  Info,
  CheckCircle2,
} from 'lucide-react';

/**
 * ManufacturingOrderForm Component
 * Modal form to create or edit a Manufacturing Order.
 */
export const ManufacturingOrderForm = ({ mo, isOpen, onClose, onSuccess }) => {
  const isEditMode = Boolean(mo && (mo._id || mo.id));

  // Form Fields
  const [formData, setFormData] = useState({
    finishedProduct: '',
    bom: '',
    quantity: 1,
    priority: 'medium',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedEndDate: '',
    notes: '',
    moNumber: '',
  });

  // Dropdown options lists
  const [products, setProducts] = useState([]);
  const [availableBoms, setAvailableBoms] = useState([]);

  // BOM Preview Calculation State
  const [previewReqs, setPreviewReqs] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [error, setError] = useState(null);

  // Load products list when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProductsList = async () => {
      setFetchingOptions(true);
      setError(null);
      try {
        const url = endpoints?.products?.list || '/products';
        const res = await axios.get(url, { params: { limit: 100 } });
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setProducts(list);
      } catch (err) {
        console.error('Error fetching products list:', err);
        setError('Failed to load finished products list.');
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchProductsList();
  }, [isOpen]);

  // Populate form data on open or edit
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && mo) {
      const prodId = typeof mo.finishedProduct === 'object' ? mo.finishedProduct?._id : mo.finishedProduct;
      const bomId = typeof mo.bom === 'object' ? mo.bom?._id : mo.bom;

      setFormData({
        finishedProduct: prodId || '',
        bom: bomId || '',
        quantity: mo.quantity || 1,
        priority: mo.priority || 'medium',
        plannedStartDate: mo.plannedStartDate ? new Date(mo.plannedStartDate).toISOString().split('T')[0] : '',
        plannedEndDate: mo.plannedEndDate ? new Date(mo.plannedEndDate).toISOString().split('T')[0] : '',
        notes: mo.notes || '',
        moNumber: mo.moNumber || '',
      });
    } else {
      setFormData({
        finishedProduct: '',
        bom: '',
        quantity: 1,
        priority: 'medium',
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: '',
        notes: '',
        moNumber: '',
      });
      setAvailableBoms([]);
      setPreviewReqs(null);
    }
    setError(null);
  }, [isOpen, isEditMode, mo]);

  // When finished product changes, fetch associated active BOMs
  useEffect(() => {
    if (!isOpen || !formData.finishedProduct) {
      setAvailableBoms([]);
      return;
    }

    const fetchBOMsForProduct = async () => {
      try {
        const prodId = formData.finishedProduct;
        const bomsUrl = endpoints?.boms?.getByProduct
          ? endpoints.boms.getByProduct(prodId)
          : `/boms/product/${prodId}`;

        const res = await axios.get(bomsUrl);
        const bomList = Array.isArray(res?.data?.data) ? res.data.data : [];

        // Filter active BOMs
        const activeList = bomList.filter((b) => b.isActive !== false);
        setAvailableBoms(activeList);

        // Auto select first active BOM if not editing or if current bom doesn't belong
        if (!isEditMode && activeList.length > 0) {
          setFormData((prev) => ({ ...prev, bom: activeList[0]._id || activeList[0].id }));
        }
      } catch (err) {
        console.warn('Could not fetch BOMs for product:', err);
        setAvailableBoms([]);
      }
    };

    fetchBOMsForProduct();
  }, [isOpen, formData.finishedProduct, isEditMode]);

  // Fetch BOM requirement calculations when BOM or quantity changes
  useEffect(() => {
    if (!isOpen || !formData.bom || !formData.quantity || Number(formData.quantity) <= 0) {
      setPreviewReqs(null);
      return;
    }

    const calculatePreview = async () => {
      setLoadingPreview(true);
      try {
        const calcUrl = endpoints?.boms?.calculateRequirements
          ? endpoints.boms.calculateRequirements(formData.bom)
          : `/boms/${formData.bom}/calculate-requirements`;

        const res = await axios.get(calcUrl, {
          params: { quantity: formData.quantity },
        });

        if (res?.data?.data) {
          setPreviewReqs(res.data.data);
        }
      } catch (err) {
        console.warn('Could not calculate preview requirements:', err);
        setPreviewReqs(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    const debounceCalc = setTimeout(calculatePreview, 300);
    return () => clearTimeout(debounceCalc);
  }, [isOpen, formData.bom, formData.quantity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.finishedProduct) {
      setError('Please select a finished product.');
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Manufacturing quantity must be greater than zero.');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const payload = {
        finishedProduct: formData.finishedProduct,
        quantity: qty,
        priority: formData.priority,
        plannedStartDate: formData.plannedStartDate || undefined,
        plannedEndDate: formData.plannedEndDate || undefined,
        notes: formData.notes ? formData.notes.trim() : '',
      };

      if (formData.bom) {
        payload.bom = formData.bom;
      }

      if (formData.moNumber && formData.moNumber.trim()) {
        payload.moNumber = formData.moNumber.trim().toUpperCase();
      }

      let response;
      if (isEditMode) {
        const moId = mo._id || mo.id;
        const updateUrl = `${baseUrl}/${moId}`;
        response = await axios.put(updateUrl, payload);
      } else {
        response = await axios.post(baseUrl, payload);
      }

      const savedMO = response?.data?.data || response?.data;
      if (onSuccess) {
        onSuccess(savedMO, isEditMode ? 'updated' : 'created');
      }
      onClose();
    } catch (err) {
      console.error('Error saving Manufacturing Order:', err);
      setError(
        err?.response?.data?.message || err?.message || 'Failed to save Manufacturing Order.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Factory className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isEditMode ? `Edit Order #${mo?.moNumber}` : 'New Manufacturing Order'}
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                {isEditMode
                  ? 'Update order quantity, priority, and schedule dates'
                  : 'Schedule new production run and explode BOM raw materials'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Finished Product & Custom MO Number Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Finished Product <span className="text-red-500">*</span>
              </label>
              {fetchingOptions ? (
                <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Loading products...</span>
                </div>
              ) : (
                <select
                  name="finishedProduct"
                  value={formData.finishedProduct}
                  onChange={handleChange}
                  disabled={isEditMode}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                >
                  <option value="">-- Select Output Product --</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} - Stock: {p.stockOnHand || 0} {p.unitOfMeasure || 'pcs'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                MO Ref # <span className="text-gray-400 font-normal">(Auto)</span>
              </label>
              <input
                type="text"
                name="moNumber"
                value={formData.moNumber}
                onChange={handleChange}
                placeholder="MO-YYYYMMDD-XXXX"
                disabled={isEditMode}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono disabled:bg-gray-100 uppercase"
              />
            </div>
          </div>

          {/* BOM Formula Selection & Production Quantity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Bill of Materials (BOM) Formula
              </label>
              <select
                name="bom"
                value={formData.bom}
                onChange={handleChange}
                disabled={isEditMode || !formData.finishedProduct}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                {availableBoms.length === 0 ? (
                  <option value="">
                    {formData.finishedProduct
                      ? 'No active BOM found (System will auto-assign)'
                      : 'Select a finished product first'}
                  </option>
                ) : (
                  availableBoms.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      BOM #{b.code} (v{b.version || '1.0'}) - Base: {b.quantity}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="any"
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono font-bold text-gray-900"
              />
            </div>
          </div>

          {/* Priority & Schedule Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Order Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white font-medium"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Planned Start
              </label>
              <input
                type="date"
                name="plannedStartDate"
                value={formData.plannedStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Planned End
              </label>
              <input
                type="date"
                name="plannedEndDate"
                value={formData.plannedEndDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-medium"
              />
            </div>
          </div>

          {/* BOM Raw Material Demand Live Preview Box */}
          {formData.bom && (
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Estimated Material Consumption Breakdown
                </span>
                {loadingPreview && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />}
              </div>

              {previewReqs?.components?.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {previewReqs.components.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-purple-100"
                    >
                      <span className="font-semibold text-gray-800">
                        {c.productName || 'Raw Material'}
                      </span>
                      <span className="font-mono font-bold text-purple-800">
                        {c.requiredQuantity} {c.unitOfMeasure || 'pcs'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 italic">
                  Raw material demands will automatically snapshot upon order creation.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Production Notes & Instructions
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Special manufacturing notes, batch numbers, or client references..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditMode ? 'Update Order' : 'Create Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManufacturingOrderForm;
