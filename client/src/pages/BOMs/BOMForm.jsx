import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import {
  X,
  Layers,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Boxes,
  Cpu,
  Clock,
  Info,
} from 'lucide-react';

export const BOMForm = ({ bom, isOpen, onClose, onSuccess }) => {
  const isEdit = Boolean(bom && (bom._id || bom.id));

  // Options loaded from backend
  const [productsList, setProductsList] = useState([]);
  const [workCentersList, setWorkCentersList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form State matching actual Mongoose BOM schema
  const [formData, setFormData] = useState({
    code: '',
    finishedProduct: '',
    quantity: 1,
    version: '1.0',
    notes: '',
    isActive: true,
    components: [
      { product: '', quantity: 1, unitOfMeasure: 'pcs' },
    ],
    operations: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Products and Work Centers for selection dropdowns
  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdownData = async () => {
      setLoadingOptions(true);
      try {
        const prodUrl = endpoints?.products?.list || '/products';
        const wcUrl = endpoints?.workCenters?.list || '/work-centers';

        const [prodRes, wcRes] = await Promise.all([
          axios.get(prodUrl, { params: { limit: 100 } }),
          axios.get(wcUrl, { params: { limit: 100 } }),
        ]);

        const prods = Array.isArray(prodRes?.data?.data)
          ? prodRes.data.data
          : Array.isArray(prodRes?.data)
          ? prodRes.data
          : [];

        const wcs = Array.isArray(wcRes?.data?.data)
          ? wcRes.data.data
          : Array.isArray(wcRes?.data)
          ? wcRes.data
          : [];

        setProductsList(prods);
        setWorkCentersList(wcs);
      } catch (err) {
        console.error('Error loading product or work center options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchDropdownData();
  }, [isOpen]);

  // Sync state when modal opens or BOM prop changes
  useEffect(() => {
    if (bom && isOpen) {
      const fpId =
        typeof bom.finishedProduct === 'object'
          ? bom.finishedProduct?._id
          : bom.finishedProduct || '';

      const comps = Array.isArray(bom.components) && bom.components.length > 0
        ? bom.components.map((c) => ({
            product: typeof c.product === 'object' ? c.product?._id : c.product || '',
            quantity: c.quantity ?? 1,
            unitOfMeasure: c.unitOfMeasure || (typeof c.product === 'object' ? c.product?.unitOfMeasure : 'pcs') || 'pcs',
          }))
        : [{ product: '', quantity: 1, unitOfMeasure: 'pcs' }];

      const ops = Array.isArray(bom.operations)
        ? bom.operations.map((o, idx) => ({
            sequence: o.sequence || idx + 1,
            name: o.name || `Operation ${idx + 1}`,
            workCenter: typeof o.workCenter === 'object' ? o.workCenter?._id : o.workCenter || '',
            durationMinutes: o.durationMinutes ?? 60,
          }))
        : [];

      setFormData({
        code: bom.code || '',
        finishedProduct: fpId,
        quantity: bom.quantity ?? 1,
        version: bom.version || '1.0',
        notes: bom.notes || '',
        isActive: bom.isActive !== undefined ? bom.isActive : true,
        components: comps,
        operations: ops,
      });
    } else if (isOpen) {
      setFormData({
        code: '',
        finishedProduct: '',
        quantity: 1,
        version: '1.0',
        notes: '',
        isActive: true,
        components: [{ product: '', quantity: 1, unitOfMeasure: 'pcs' }],
        operations: [],
      });
    }

    setFormErrors({});
    setServerError(null);
  }, [bom, isOpen]);

  if (!isOpen) return null;

  // Validation Logic adhering strictly to backend service rules
  const validateForm = () => {
    const errors = {};

    if (!formData.code || !formData.code.trim()) {
      errors.code = 'BOM Code is required';
    }

    if (!formData.finishedProduct) {
      errors.finishedProduct = 'Finished product reference is required';
    }

    if (formData.quantity === '' || Number(formData.quantity) <= 0) {
      errors.quantity = 'Output base quantity must be greater than 0';
    }

    // Component Validations
    if (!Array.isArray(formData.components) || formData.components.length === 0) {
      errors.components = 'At least one component is required in the BOM';
    } else {
      const selectedComps = [];
      const compErrors = [];

      formData.components.forEach((comp, idx) => {
        const errObj = {};
        if (!comp.product) {
          errObj.product = 'Component product is required';
        } else {
          // Self reference check
          if (comp.product === formData.finishedProduct) {
            errObj.product = 'Product cannot be listed as its own component';
          }
          // Duplicate component check
          if (selectedComps.includes(comp.product)) {
            errObj.product = 'Duplicate component product selected';
          } else {
            selectedComps.push(comp.product);
          }
        }

        if (comp.quantity === '' || Number(comp.quantity) <= 0) {
          errObj.quantity = 'Quantity must be > 0';
        }

        if (Object.keys(errObj).length > 0) {
          compErrors[idx] = errObj;
        }
      });

      if (compErrors.length > 0) {
        errors.componentErrors = compErrors;
      }
    }

    // Operation Validations
    if (Array.isArray(formData.operations) && formData.operations.length > 0) {
      const opErrors = [];
      formData.operations.forEach((op, idx) => {
        const errObj = {};
        if (!op.name || !op.name.trim()) {
          errObj.name = 'Operation name required';
        }
        if (!op.workCenter) {
          errObj.workCenter = 'Work center required';
        }
        if (op.durationMinutes === '' || Number(op.durationMinutes) <= 0) {
          errObj.durationMinutes = 'Duration must be >= 1 min';
        }
        if (Object.keys(errObj).length > 0) {
          opErrors[idx] = errObj;
        }
      });

      if (opErrors.length > 0) {
        errors.operationErrors = opErrors;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Header level inputs change
  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (type === 'number') {
      val = value === '' ? '' : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? String(val).toUpperCase() : val,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  // Component Row Management
  const handleComponentChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedComps = [...prev.components];
      const targetComp = { ...updatedComps[index] };

      if (field === 'product') {
        targetComp.product = value;
        // Auto pick unit of measure from product if available
        const selectedProd = productsList.find((p) => (p._id || p.id) === value);
        if (selectedProd && selectedProd.unitOfMeasure) {
          targetComp.unitOfMeasure = selectedProd.unitOfMeasure;
        }
      } else if (field === 'quantity') {
        targetComp.quantity = value === '' ? '' : Number(value);
      } else {
        targetComp[field] = value;
      }

      updatedComps[index] = targetComp;
      return { ...prev, components: updatedComps };
    });

    if (serverError) setServerError(null);
  };

  const addComponentRow = () => {
    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, { product: '', quantity: 1, unitOfMeasure: 'pcs' }],
    }));
  };

  const removeComponentRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  // Operation Row Management
  const handleOperationChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedOps = [...prev.operations];
      const targetOp = { ...updatedOps[index] };

      if (field === 'durationMinutes' || field === 'sequence') {
        targetOp[field] = value === '' ? '' : Number(value);
      } else {
        targetOp[field] = value;
      }

      updatedOps[index] = targetOp;
      return { ...prev, operations: updatedOps };
    });

    if (serverError) setServerError(null);
  };

  const addOperationRow = () => {
    setFormData((prev) => {
      const nextSeq = prev.operations.length + 1;
      return {
        ...prev,
        operations: [
          ...prev.operations,
          {
            sequence: nextSeq,
            name: `Operation ${nextSeq}`,
            workCenter: '',
            durationMinutes: 60,
          },
        ],
      };
    });
  };

  const removeOperationRow = (index) => {
    setFormData((prev) => {
      const filtered = prev.operations.filter((_, i) => i !== index);
      // Re-sequence
      const reSequenced = filtered.map((op, idx) => ({ ...op, sequence: idx + 1 }));
      return { ...prev, operations: reSequenced };
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      finishedProduct: formData.finishedProduct,
      quantity: Number(formData.quantity) || 1,
      version: formData.version ? formData.version.trim() : '1.0',
      notes: formData.notes ? formData.notes.trim() : '',
      isActive: Boolean(formData.isActive),
      components: formData.components.map((c) => ({
        product: c.product,
        quantity: Number(c.quantity),
        unitOfMeasure: c.unitOfMeasure || 'pcs',
      })),
      operations: formData.operations.map((o, idx) => ({
        sequence: Number(o.sequence) || idx + 1,
        name: o.name.trim(),
        workCenter: o.workCenter,
        durationMinutes: Number(o.durationMinutes) || 60,
      })),
    };

    try {
      const baseUrl = endpoints?.boms?.list || '/boms';
      let response;

      if (isEdit) {
        const id = bom._id || bom.id;
        const updateUrl = endpoints?.boms?.update
          ? endpoints.boms.update(id)
          : `${baseUrl}/${id}`;
        response = await axios.put(updateUrl, payload);
      } else {
        const createUrl = endpoints?.boms?.create || baseUrl;
        response = await axios.post(createUrl, payload);
      }

      const savedBOM = response?.data?.data || response?.data;
      if (onSuccess) {
        onSuccess(savedBOM, isEdit ? 'updated' : 'created');
      }
      onClose();
    } catch (err) {
      console.error('Error saving BOM:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save Bill of Materials. Please check inputs and retry.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mms-modal-overlay" onClick={onClose}>
      <div className="mms-modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Bill of Materials (BOM)' : 'Create New Bill of Materials'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? `Updating formula structure for BOM Code: ${formData.code}`
                  : 'Define manufacturing components, base outputs, and routing operations'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* SECTION 1: HEADER DETAILS */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-blue-600" /> Header Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Finished Product Selector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Finished Output Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="finishedProduct"
                  value={formData.finishedProduct}
                  onChange={handleHeaderChange}
                  disabled={loadingOptions}
                  className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all bg-white font-medium ${
                    formErrors.finishedProduct
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600'
                  }`}
                >
                  <option value="">-- Select Finished Manufactured Product --</option>
                  {productsList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} ({p.sku}) - [{p.category ? p.category.replace('_', ' ') : 'Product'}]
                    </option>
                  ))}
                </select>
                {formErrors.finishedProduct && (
                  <p className="text-[11px] text-red-600 mt-1">{formErrors.finishedProduct}</p>
                )}
              </div>

              {/* BOM Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  BOM Identifier / Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleHeaderChange}
                  placeholder="e.g. BOM-FG-001"
                  className={`w-full px-3 py-2 text-xs font-mono uppercase border rounded-lg outline-none transition-all ${
                    formErrors.code
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600'
                  }`}
                />
                {formErrors.code && <p className="text-[11px] text-red-600 mt-1">{formErrors.code}</p>}
              </div>

              {/* Base Output Quantity */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Base Output Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  step="0.01"
                  min="0.0001"
                  value={formData.quantity}
                  onChange={handleHeaderChange}
                  className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                    formErrors.quantity
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600'
                  }`}
                />
                {formErrors.quantity && <p className="text-[11px] text-red-600 mt-1">{formErrors.quantity}</p>}
              </div>

              {/* Version */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Version
                </label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleHeaderChange}
                  placeholder="e.g. 1.0"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Status State
                </label>
                <select
                  name="isActive"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white font-medium"
                >
                  <option value="true">Active (Released for Production)</option>
                  <option value="false">Inactive / Archived</option>
                </select>
              </div>

              {/* Notes */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Engineering / Process Notes
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleHeaderChange}
                  placeholder="Manufacturing instructions, special tolerances, or revision details..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none bg-white"
                ></textarea>
              </div>
            </div>
          </div>

          {/* SECTION 2: COMPONENTS / MATERIALS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-emerald-600" /> Component Materials Requirement
                  <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Raw materials or sub-assemblies required to manufacture {formData.quantity || 1} unit(s)
                </p>
              </div>

              <button
                type="button"
                onClick={addComponentRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Component</span>
              </button>
            </div>

            {formErrors.components && (
              <p className="text-xs text-red-600 font-medium">{formErrors.components}</p>
            )}

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Component / Material Product</th>
                    <th className="py-2.5 px-3 w-32">Qty Required</th>
                    <th className="py-2.5 px-3 w-28">Unit (UOM)</th>
                    <th className="py-2.5 px-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {formData.components.map((comp, idx) => {
                    const rowErr = formErrors.componentErrors?.[idx] || {};

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>

                        {/* Product Selector */}
                        <td className="py-2 px-3">
                          <select
                            value={comp.product}
                            onChange={(e) => handleComponentChange(idx, 'product', e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white font-medium ${
                              rowErr.product
                                ? 'border-red-500 bg-red-50/30'
                                : 'border-gray-300 focus:border-emerald-600'
                            }`}
                          >
                            <option value="">-- Select Material / Component --</option>
                            {productsList.map((p) => (
                              <option key={p._id || p.id} value={p._id || p.id}>
                                {p.name} ({p.sku}) [Stock: {p.stockOnHand ?? 0} {p.unitOfMeasure || 'pcs'}]
                              </option>
                            ))}
                          </select>
                          {rowErr.product && (
                            <p className="text-[10px] text-red-600 mt-0.5">{rowErr.product}</p>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            value={comp.quantity}
                            onChange={(e) => handleComponentChange(idx, 'quantity', e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-mono ${
                              rowErr.quantity
                                ? 'border-red-500 bg-red-50/30'
                                : 'border-gray-300 focus:border-emerald-600'
                            }`}
                          />
                          {rowErr.quantity && (
                            <p className="text-[10px] text-red-600 mt-0.5">{rowErr.quantity}</p>
                          )}
                        </td>

                        {/* Unit of measure */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={comp.unitOfMeasure}
                            onChange={(e) => handleComponentChange(idx, 'unitOfMeasure', e.target.value)}
                            placeholder="pcs"
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-emerald-600 font-mono"
                          />
                        </td>

                        {/* Delete Row */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeComponentRow(idx)}
                            disabled={formData.components.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Remove Component"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: OPERATIONS / ROUTING TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-600" /> Operations Routing (Work Centers)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Sequential shop floor tasks and estimated work center duration
                </p>
              </div>

              <button
                type="button"
                onClick={addOperationRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Operation</span>
              </button>
            </div>

            {formData.operations.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                <span>No routing operations defined yet. Click "Add Operation" to attach work center tasks.</span>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                      <th className="py-2.5 px-3 w-14 text-center">Seq</th>
                      <th className="py-2.5 px-3">Operation Description</th>
                      <th className="py-2.5 px-3">Assigned Work Center</th>
                      <th className="py-2.5 px-3 w-32">Duration (Mins)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {formData.operations.map((op, idx) => {
                      const rowErr = formErrors.operationErrors?.[idx] || {};

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          {/* Sequence */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={op.sequence}
                              onChange={(e) => handleOperationChange(idx, 'sequence', e.target.value)}
                              className="w-10 px-1 py-1 text-xs text-center border border-gray-300 rounded font-mono font-bold"
                            />
                          </td>

                          {/* Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={op.name}
                              onChange={(e) => handleOperationChange(idx, 'name', e.target.value)}
                              placeholder="e.g. CNC Milling"
                              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none ${
                                rowErr.name ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-purple-600'
                              }`}
                            />
                            {rowErr.name && (
                              <p className="text-[10px] text-red-600 mt-0.5">{rowErr.name}</p>
                            )}
                          </td>

                          {/* Work Center */}
                          <td className="py-2 px-3">
                            <select
                              value={op.workCenter}
                              onChange={(e) => handleOperationChange(idx, 'workCenter', e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white font-medium ${
                                rowErr.workCenter
                                  ? 'border-red-500 bg-red-50/30'
                                  : 'border-gray-300 focus:border-purple-600'
                              }`}
                            >
                              <option value="">-- Select Work Center --</option>
                              {workCentersList.map((wc) => (
                                <option key={wc._id || wc.id} value={wc._id || wc.id}>
                                  {wc.name} ({wc.code}) [${wc.costPerHour ?? 0}/hr]
                                </option>
                              ))}
                            </select>
                            {rowErr.workCenter && (
                              <p className="text-[10px] text-red-600 mt-0.5">{rowErr.workCenter}</p>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={op.durationMinutes}
                                onChange={(e) => handleOperationChange(idx, 'durationMinutes', e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-mono ${
                                  rowErr.durationMinutes
                                    ? 'border-red-500 bg-red-50/30'
                                    : 'border-gray-300 focus:border-purple-600'
                                }`}
                              />
                              <span className="text-[11px] text-gray-500">m</span>
                            </div>
                            {rowErr.durationMinutes && (
                              <p className="text-[10px] text-red-600 mt-0.5">{rowErr.durationMinutes}</p>
                            )}
                          </td>

                          {/* Delete Operation */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeOperationRow(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove Operation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer actions */}
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
              className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving BOM...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Update Bill of Materials' : 'Create Bill of Materials'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BOMForm;
