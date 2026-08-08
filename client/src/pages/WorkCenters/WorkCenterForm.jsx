import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import { X, Cpu, Check, AlertCircle, Loader2 } from 'lucide-react';

export const WorkCenterForm = ({ workCenter, isOpen, onClose, onSuccess }) => {
  const isEdit = Boolean(workCenter && (workCenter._id || workCenter.id));

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    capacityPerHour: 1,
    costPerHour: 0,
    status: 'active',
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (workCenter) {
      setFormData({
        name: workCenter.name || '',
        code: workCenter.code || '',
        description: workCenter.description || '',
        capacityPerHour: workCenter.capacityPerHour ?? 1,
        costPerHour: workCenter.costPerHour ?? 0,
        status: workCenter.status || (workCenter.isActive ? 'active' : 'inactive'),
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        capacityPerHour: 1,
        costPerHour: 0,
        status: 'active',
      });
    }
    setFormErrors({});
    setServerError(null);
  }, [workCenter, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Work Center name is required';
    }
    if (!formData.code || !formData.code.trim()) {
      errors.code = 'Work Center code is required';
    }
    if (formData.capacityPerHour === '' || Number(formData.capacityPerHour) < 0.1) {
      errors.capacityPerHour = 'Capacity per hour must be at least 0.1';
    }
    if (formData.costPerHour === '' || Number(formData.costPerHour) < 0) {
      errors.costPerHour = 'Cost per hour cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? String(val).toUpperCase() : val,
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
      code: formData.code.trim().toUpperCase(),
      description: formData.description ? formData.description.trim() : '',
      capacityPerHour: Number(formData.capacityPerHour) || 1,
      costPerHour: Number(formData.costPerHour) || 0,
      status: formData.status,
    };

    try {
      const baseUrl = endpoints?.workCenters?.list || '/work-centers';
      let response;

      if (isEdit) {
        const id = workCenter._id || workCenter.id;
        const updateUrl = endpoints?.workCenters?.update
          ? endpoints.workCenters.update(id)
          : `${baseUrl}/${id}`;
        response = await axios.put(updateUrl, payload);
      } else {
        const createUrl = endpoints?.workCenters?.create || baseUrl;
        response = await axios.post(createUrl, payload);
      }

      const savedWorkCenter = response?.data?.data || response?.data;
      if (onSuccess) {
        onSuccess(savedWorkCenter, isEdit ? 'updated' : 'created');
      }
      onClose();
    } catch (err) {
      console.error('Error saving work center:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save work center. Please check inputs and retry.';
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
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Work Center' : 'Add New Work Center'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? `Updating configuration for Code: ${formData.code}`
                  : 'Register a shop floor manufacturing cell or machine resource'}
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
            {/* Work Center Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Work Center Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. CNC Milling Machine - Station A"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.name ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            {/* Work Center Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Work Center Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. WC-CNC-01"
                className={`w-full px-3 py-2 text-xs font-mono uppercase border rounded-lg outline-none transition-all ${
                  formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.code && <p className="text-[11px] text-red-600 mt-1">{formErrors.code}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Operating Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white font-medium"
              >
                <option value="active">Active (Online)</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive (Offline)</option>
              </select>
            </div>

            {/* Capacity Per Hour */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Capacity Per Hour <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacityPerHour"
                step="0.1"
                value={formData.capacityPerHour}
                onChange={handleChange}
                min="0.1"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.capacityPerHour ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.capacityPerHour && <p className="text-[11px] text-red-600 mt-1">{formErrors.capacityPerHour}</p>}
            </div>

            {/* Cost Per Hour */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Cost Per Hour ($/hr) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="costPerHour"
                step="0.01"
                value={formData.costPerHour}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all ${
                  formErrors.costPerHour ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {formErrors.costPerHour && <p className="text-[11px] text-red-600 mt-1">{formErrors.costPerHour}</p>}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Description & Equipment Specifications
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Machine specs, location, operating instructions, or toolings..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              ></textarea>
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
                  <span>{isEdit ? 'Update Work Center' : 'Create Work Center'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkCenterForm;
