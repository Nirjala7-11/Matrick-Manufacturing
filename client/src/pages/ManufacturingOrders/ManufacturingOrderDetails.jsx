import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import MOStatusBadge from './components/MOStatusBadge';
import MOComponentRequirements from './components/MOComponentRequirements';
import MOProgress from './components/MOProgress';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

import {
  Factory,
  X,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit,
  Clock,
  Calendar,
  Layers,
  Boxes,
  Cpu,
  Package,
  User,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react';

/**
 * ManufacturingOrderDetails Component
 * Displays comprehensive details for a Manufacturing Order including:
 * - Product & BOM specifications
 * - Workflow state transitions (Confirm, Start, Complete, Cancel)
 * - Raw material requirements & live stock availability
 * - Associated Work Center operations / Work Orders
 */
export const ManufacturingOrderDetails = ({
  moId,
  isOpen,
  onClose,
  onEdit,
  onStatusChanged,
}) => {
  const [mo, setMo] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'components' | 'workOrders'

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [loadingWos, setLoadingWos] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  /**
   * Fetch MO Details
   */
  const fetchMoDetails = useCallback(async () => {
    if (!moId) return;
    setLoading(true);
    setError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const getUrl = `${baseUrl}/${moId}`;
      const response = await axios.get(getUrl);

      const moData = response?.data?.data || response?.data;
      setMo(moData);
    } catch (err) {
      console.error('Error fetching MO details:', err);
      setError(err?.response?.data?.message || 'Failed to load Manufacturing Order details.');
    } finally {
      setLoading(false);
    }
  }, [moId]);

  /**
   * Fetch Associated Work Orders for this MO
   */
  const fetchWorkOrders = useCallback(async () => {
    if (!moId) return;
    setLoadingWos(true);

    try {
      const woUrl = `/work-orders/manufacturing-order/${moId}`;
      const response = await axios.get(woUrl);

      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setWorkOrders(list);
    } catch (err) {
      console.warn('Could not load work orders for MO:', err);
      setWorkOrders([]);
    } finally {
      setLoadingWos(false);
    }
  }, [moId]);

  useEffect(() => {
    if (isOpen && moId) {
      fetchMoDetails();
      fetchWorkOrders();
    } else {
      setMo(null);
      setWorkOrders([]);
      setActiveTab('overview');
      setActionMessage(null);
    }
  }, [isOpen, moId, fetchMoDetails, fetchWorkOrders]);

  /**
   * Workflow Action Handlers
   */
  const handleConfirmOrder = async () => {
    if (!moId) return;
    setActionLoading(true);
    setError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const confirmUrl = `${baseUrl}/${moId}/confirm`;
      const response = await axios.post(confirmUrl);

      const updated = response?.data?.data || response?.data;
      setMo(updated);
      setActionMessage('Order confirmed successfully. Raw material availability snapshot evaluated.');
      if (onStatusChanged) onStatusChanged(updated);
    } catch (err) {
      console.error('Error confirming MO:', err);
      setError(err?.response?.data?.message || 'Failed to confirm Manufacturing Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartOrder = async () => {
    if (!moId) return;
    setActionLoading(true);
    setError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const startUrl = `${baseUrl}/${moId}/start`;
      const response = await axios.post(startUrl);

      const updated = response?.data?.data || response?.data;
      setMo(updated);
      setActionMessage('Manufacturing Order execution started.');
      if (onStatusChanged) onStatusChanged(updated);
      fetchWorkOrders();
    } catch (err) {
      console.error('Error starting MO:', err);
      setError(err?.response?.data?.message || 'Failed to start Manufacturing Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateWorkOrders = async () => {
    if (!moId) return;
    setActionLoading(true);
    setError(null);

    try {
      const genUrl = `/work-orders/generate/${moId}`;
      await axios.post(genUrl);

      setActionMessage('Work Orders generated successfully from BOM routing operations.');
      fetchWorkOrders();
    } catch (err) {
      console.error('Error generating work orders:', err);
      setError(err?.response?.data?.message || 'Failed to generate Work Orders.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!moId) return;

    if (!window.confirm('Are you sure you want to mark this Manufacturing Order as Completed?\nFinished goods stock will be posted to inventory.')) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const completeUrl = `${baseUrl}/${moId}/complete`;
      const response = await axios.post(completeUrl);

      const updated = response?.data?.data || response?.data;
      setMo(updated);
      setActionMessage('Manufacturing Order completed successfully!');
      if (onStatusChanged) onStatusChanged(updated);
    } catch (err) {
      console.error('Error completing MO:', err);
      setError(err?.response?.data?.message || 'Failed to complete Manufacturing Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!moId) return;

    if (!window.confirm('Are you sure you want to cancel this Manufacturing Order?')) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const cancelUrl = `${baseUrl}/${moId}/cancel`;
      const response = await axios.post(cancelUrl);

      const updated = response?.data?.data || response?.data;
      setMo(updated);
      setActionMessage('Manufacturing Order cancelled.');
      if (onStatusChanged) onStatusChanged(updated);
    } catch (err) {
      console.error('Error cancelling MO:', err);
      setError(err?.response?.data?.message || 'Failed to cancel Manufacturing Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshedComponentAvailability = (refreshedData) => {
    if (refreshedData && mo) {
      setMo((prev) => ({
        ...prev,
        componentAvailabilityStatus: refreshedData.componentAvailabilityStatus,
        componentRequirements: refreshedData.components || prev.componentRequirements,
      }));
      setActionMessage('Live stock availability rechecked and updated.');
    }
  };

  if (!isOpen) return null;

  const finishedProd = typeof mo?.finishedProduct === 'object' ? mo.finishedProduct : {};
  const bomDoc = typeof mo?.bom === 'object' ? mo.bom : {};
  const createdUser = typeof mo?.createdBy === 'object' ? mo.createdBy : {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Factory className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-purple-100">
                  {mo?.moNumber || 'Manufacturing Order'}
                </span>
                {mo && <MOStatusBadge type="status" value={mo.status} size="sm" />}
                {mo && <MOStatusBadge type="priority" value={mo.priority} size="sm" />}
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                {finishedProd.name || 'Output Product'} — Target:{' '}
                <strong className="font-mono text-white">
                  {dashboardUtils.formatNumber(mo?.quantity || 0, 2)} {mo?.unitOfMeasure || finishedProd.unitOfMeasure || 'pcs'}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        {mo && (
          <div className="bg-gray-50 p-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Stock Status:</span>
              <MOStatusBadge type="availability" value={mo.componentAvailabilityStatus} size="sm" />
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {mo.status === 'draft' && (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Order</span>
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(mo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Planning</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {mo.status === 'confirmed' && (
                <>
                  {workOrders.length === 0 && (
                    <button
                      type="button"
                      onClick={handleGenerateWorkOrders}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Generate Work Orders</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Start Execution</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {mo.status === 'in_progress' && (
                <>
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={fetchMoDetails}
                disabled={loading}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                title="Refresh Details"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Action / Error Banner Messages */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 font-medium flex items-center justify-between shrink-0">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 text-xs text-red-800 font-medium flex items-center justify-between shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
            <p className="text-xs font-semibold">Loading Manufacturing Order Details...</p>
          </div>
        ) : !mo ? (
          <div className="p-12 text-center text-gray-400">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
            <p className="text-xs font-semibold text-gray-700">Order not found.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Visual Workflow Stepper */}
            <MOProgress status={mo.status} workOrders={workOrders} />

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 flex items-center gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Order Overview & Schedule
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('components')}
                className={`pb-2.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'components'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Component Requirements</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
                  {mo.componentRequirements?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('workOrders')}
                className={`pb-2.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'workOrders'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Work Orders / Operations</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
                  {workOrders.length}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & SCHEDULE */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Output Product Card */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-600" />
                      Output Finished Product
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Product Name:</span>
                        <span className="font-bold text-gray-900">{finishedProd.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SKU Code:</span>
                        <span className="font-mono text-gray-700">{finishedProd.sku || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium text-gray-800">{finishedProd.category || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current Stock On Hand:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {dashboardUtils.formatNumber(finishedProd.stockOnHand || 0, 2)} {finishedProd.unitOfMeasure || 'pcs'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOM & Order Specifications */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      BOM & Order Specifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">BOM Code:</span>
                        <span className="font-mono font-bold text-purple-700">
                          {bomDoc.code ? `BOM #${bomDoc.code}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">BOM Version:</span>
                        <span className="font-mono text-gray-700">v{bomDoc.version || '1.0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Quantity:</span>
                        <span className="font-mono font-bold text-gray-900">
                          {dashboardUtils.formatNumber(mo.quantity, 2)} {mo.unitOfMeasure || 'pcs'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created By:</span>
                        <span className="font-medium text-gray-800">
                          {createdUser.firstName ? `${createdUser.firstName} ${createdUser.lastName || ''}` : 'System'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Timelines */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Planning & Execution Timelines
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Planned Start</span>
                      <span className="font-mono font-bold text-gray-800 mt-0.5 block">
                        {mo.plannedStartDate ? new Date(mo.plannedStartDate).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Planned Completion</span>
                      <span className="font-mono font-bold text-gray-800 mt-0.5 block">
                        {mo.plannedEndDate ? new Date(mo.plannedEndDate).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Actual Start</span>
                      <span className="font-mono font-bold text-amber-700 mt-0.5 block">
                        {mo.actualStartDate ? new Date(mo.actualStartDate).toLocaleString() : 'Not Started'}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Actual End</span>
                      <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                        {mo.actualEndDate ? new Date(mo.actualEndDate).toLocaleString() : 'Incomplete'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {mo.notes && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Production Notes
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{mo.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COMPONENT REQUIREMENTS */}
            {activeTab === 'components' && (
              <MOComponentRequirements
                moId={mo._id}
                components={mo.componentRequirements || []}
                availabilityStatus={mo.componentAvailabilityStatus}
                onAvailabilityRefreshed={handleRefreshedComponentAvailability}
                readOnly={['completed', 'cancelled'].includes(mo.status)}
              />
            )}

            {/* TAB 3: WORK ORDERS / OPERATIONS */}
            {activeTab === 'workOrders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      Work Center Operation Routings
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Operations executed across shop floor work centers
                    </p>
                  </div>

                  {workOrders.length === 0 && mo.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={handleGenerateWorkOrders}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                    >
                      Generate Work Orders
                    </button>
                  )}
                </div>

                {loadingWos ? (
                  <div className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-purple-600 mb-2" />
                    <p className="text-xs font-medium">Loading work orders...</p>
                  </div>
                ) : workOrders.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                    <Cpu className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-medium text-gray-600">No Work Orders generated yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Work orders map BOM routing steps to specific shop floor work centers.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                          <th className="py-2.5 px-4 text-center">Seq</th>
                          <th className="py-2.5 px-4">WO Number</th>
                          <th className="py-2.5 px-4">Operation Name</th>
                          <th className="py-2.5 px-4">Work Center</th>
                          <th className="py-2.5 px-4 text-center">Planned Duration</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {workOrders.map((wo) => {
                          const wc = typeof wo.workCenter === 'object' ? wo.workCenter : {};

                          return (
                            <tr key={wo._id || wo.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">
                                #{wo.sequence || 1}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-purple-700">
                                {wo.woNumber}
                              </td>
                              <td className="py-3 px-4 font-bold text-gray-900">
                                {wo.operationName}
                              </td>
                              <td className="py-3 px-4 text-gray-700">
                                {wc.name || 'Work Center'}
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-gray-600">
                                {wo.plannedDurationMinutes || 0} mins
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                                  {wo.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManufacturingOrderDetails;
