import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import { X, Package, Check, AlertCircle, Loader2 } from 'lucide-react';

export const ProductForm = ({ product, isOpen, onClose, onSuccess }) => {
  const isEdit = Boolean(product && (product._id || product.id));

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'raw_material',
    unitOfMeasure: 'pcs',
    stockOnHand: 0,
    minStockLevel: 0,
    costPrice: 0,
    sellingPrice: 0,
    description: '',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'raw_material',
        unitOfMeasure: product.unitOfMeasure || 'pcs',
        stockOnHand: product.stockOnHand ?? 0,
        minStockLevel: product.minStockLevel ?? 0,
        costPrice: product.costPrice ?? 0,
        sellingPrice: product.sellingPrice ?? 0,
        description: product.description || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'raw_material',
        unitOfMeasure: 'pcs',
        stockOnHand: 0,
        minStockLevel: 0,
        costPrice: 0,
        sellingPrice: 0,
        description: '',
        isActive: true,
      });
    }
    setFormErrors({});
    setServerError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.sku || !formData.sku.trim()) {
      errors.sku = 'SKU/Code is required';
    }
    if (formData.minStockLevel < 0) {
      errors.minStockLevel = 'Minimum stock cannot be negative';
    }
    if (formData.costPrice < 0) {
      errors.costPrice = 'Cost price cannot be negative';
    }
    if (formData.sellingPrice < 0) {
      errors.sellingPrice = 'Selling price cannot be negative';
    }
    if (!isEdit && formData.stockOnHand < 0) {
      errors.stockOnHand = 'Stock on hand cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sku' ? String(val).toUpperCase() : val,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError(null);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: formData.category,
      unitOfMeasure: formData.unitOfMeasure.trim() || 'pcs',
      minStockLevel: Number(formData.minStockLevel) || 0,
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      description: formData.description ? formData.description.trim() : '',
      isActive: Boolean(formData.isActive),
    };

    if (!isEdit) {
      payload.stockOnHand = Number(formData.stockOnHand) || 0;
    }

    try {
      const baseUrl = endpoints?.products?.list || '/products';
      let response;

      if (isEdit) {
        const id = product._id || product.id;
        const updateUrl = endpoints?.products?.update ? endpoints.products.update(id) : `${baseUrl}/${id}`;
        response = await axios.put(updateUrl, payload);
      } else {
        const createUrl = endpoints?.products?.create || baseUrl;
        response = await axios.post(createUrl, payload);
      }

      const savedProduct = response?.data?.data || response?.data;
      if (onSuccess) {
        onSuccess(savedProduct, isEdit ? 'updated' : 'created');
      }
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save product. Please check inputs and retry.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mms-modal-overlay" onClick={onClose}>
      <div className="mms-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Product Master' : 'Add New Product'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? `Updating specification for SKU: ${formData.sku}`
                  : 'Register a new raw material, component, or finished good in inventory'}
              </p>
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Aluminium Casing 250mm"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.name ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            {/* SKU / Product Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Product Code / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. RM-ALU-001"
                className={`w-full px-3 py-2 text-xs font-mono uppercase border rounded-lg outline-none transition-all ${
                  formErrors.sku ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.sku && <p className="text-[11px] text-red-600 mt-1">{formErrors.sku}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Product Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="raw_material">Raw Material</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="component">Component</option>
                <option value="assembly">Assembly</option>
              </select>
            </div>

            {/* Unit of Measure */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                name="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleChange}
                placeholder="e.g. pcs, kg, meters, liters"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Initial Stock on Hand (Only editable on creation) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Initial Stock on Hand {isEdit && <span className="text-gray-400 font-normal">(Via Stock Ledger)</span>}
              </label>
              <input
                type="number"
                name="stockOnHand"
                value={formData.stockOnHand}
                onChange={handleChange}
                disabled={isEdit}
                min="0"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  isEdit
                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                    : formErrors.stockOnHand
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.stockOnHand && <p className="text-[11px] text-red-600 mt-1">{formErrors.stockOnHand}</p>}
            </div>

            {/* Minimum Stock Level */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Minimum Stock Level (Reorder Point)
              </label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.minStockLevel ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.minStockLevel && <p className="text-[11px] text-red-600 mt-1">{formErrors.minStockLevel}</p>}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                name="costPrice"
                step="0.01"
                value={formData.costPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.costPrice ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.costPrice && <p className="text-[11px] text-red-600 mt-1">{formErrors.costPrice}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Selling Price ($)
              </label>
              <input
                type="number"
                name="sellingPrice"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.sellingPrice ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.sellingPrice && <p className="text-[11px] text-red-600 mt-1">{formErrors.sellingPrice}</p>}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Description & Technical Notes
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product specifications, material grade, or storage instructions..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              ></textarea>
            </div>

            {/* Active Status Checkbox */}
            <div className="sm:col-span-2 flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-medium text-gray-800 cursor-pointer">
                Product is active and available for manufacturing & inventory movements
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
