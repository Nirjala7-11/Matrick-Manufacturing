import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import WOStatusBadge from './components/WOStatusBadge';
import WOProgress from './components/WOProgress';
import WOExecutionActions from './components/WOExecutionActions';

import {
  X,
  Factory,
  Layers,
  Clock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  PlayCircle,
  Building,
  Box,
  DollarSign,
  Gauge,
} from 'lucide-react';

/**
 * WorkOrderDetails - Comprehensive modal view for a single Work Order.
 * Fetches populated WorkOrder details from:
 * GET /api/work-orders/:id
 */
export const WorkOrderDetails = ({
  woId,
  isOpen,
  onClose,
  onOpenExecution,
  onStatusChanged,
}) => {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && woId) {
      fetchWorkOrderDetails();
    } else {
      setWorkOrder(null);
      setError(null);
    }
  }, [isOpen, woId]);

  const fetchWorkOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = endpoints?.workOrders?.list || '/work-orders';
      const response = await axios.get(`${baseUrl}/${woId}`);
      setWorkOrder(response?.data?.data || null);
    } catch (err) {
      console.error('Error loading Work Order details:', err);
      setError(err?.response?.data?.message || 'Failed to load Work Order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = (updatedWO) => {
    setWorkOrder(updatedWO);
    if (onStatusChanged) onStatusChanged(updatedWO);
  };

  if (!isOpen) return null;

  const mo = typeof workOrder?.manufacturingOrder === 'object' ? workOrder.manufacturingOrder : {};
  const finishedProd = typeof mo.finishedProduct === 'object' ? mo.finishedProduct : {};
  const wc = typeof workOrder?.workCenter === 'object' ? workOrder.workCenter : {};
  const operator = typeof workOrder?.assignedOperator === 'object' ? workOrder.assignedOperator : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900 text-base sm:text-lg">
                  {workOrder?.woNumber || 'Work Order'}
                </span>
                {workOrder?.status && <WOStatusBadge value={workOrder.status} size="sm" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Operation: <strong className="text-gray-800">{workOrder?.operationName || '—'}</strong> (Sequence #{workOrder?.sequence || 1})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {workOrder && onOpenExecution && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExecution(workOrder);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Shop Floor Execution</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-3" />
              <p className="font-semibold">Loading Work Order details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchWorkOrderDetails}
                className="font-bold underline text-rose-900 hover:text-rose-950"
              >
                Retry
              </button>
            </div>
          ) : workOrder ? (
            <>
              {/* Primary Action Area Banner */}
              <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                    Execution Workflow
                  </span>
                  <p className="text-xs text-purple-900 font-medium mt-0.5">
                    Authorized operators can advance or hold shop floor operations.
                  </p>
                </div>

                <WOExecutionActions
                  workOrder={workOrder}
                  onActionSuccess={handleActionSuccess}
                  layout="standard"
                />
              </div>

              {/* Manufacturing Order & Product Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold mb-2">
                    <Factory className="w-4 h-4 text-purple-600" />
                    <span className="uppercase tracking-wider text-[10px]">Manufacturing Order (MO)</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">{mo.moNumber || '—'}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-semibold">
                        {mo.status || 'Draft'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">
                      Target Batch Output: <strong className="text-gray-800">{mo.quantity || 1}</strong>
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold mb-2">
                    <Box className="w-4 h-4 text-purple-600" />
                    <span className="uppercase tracking-wider text-[10px]">Output Finished Goods</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{finishedProd.name || 'Output Goods'}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>SKU: <strong className="font-mono text-gray-800">{finishedProd.sku || 'N/A'}</strong></span>
                      <span>UOM: <strong className="text-gray-800">{finishedProd.unitOfMeasure || 'pcs'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Center & Operator Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold mb-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="uppercase tracking-wider text-[10px]">Assigned Work Center</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 text-sm">{wc.name || 'Unassigned Work Center'}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 mt-1">
                      {wc.code && <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">{wc.code}</span>}
                      {wc.capacityPerHour !== undefined && (
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-gray-400" />
                          <span>{wc.capacityPerHour} units/hr</span>
                        </span>
                      )}
                      {wc.costPerHour !== undefined && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <span>${wc.costPerHour}/hr</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold mb-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span className="uppercase tracking-wider text-[10px]">Assigned Operator</span>
                  </div>
                  {operator ? (
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 text-sm">
                        {operator.firstName} {operator.lastName}
                      </p>
                      <p className="text-gray-500 text-[11px] font-mono">{operator.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        {operator.role || 'Operator'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic py-2">No specific operator assigned yet</p>
                  )}
                </div>
              </div>

              {/* Duration & Timing Breakdown */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="uppercase tracking-wider text-[10px]">Operation Duration & Timing</span>
                  </div>

                  <WOProgress
                    plannedDuration={workOrder.plannedDurationMinutes}
                    actualDuration={workOrder.actualDurationMinutes}
                    sequence={workOrder.sequence}
                    status={workOrder.status}
                    showDetails={false}
                    className="w-36"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Planned Duration</span>
                    <span className="font-mono font-bold text-gray-900">{workOrder.plannedDurationMinutes || 0} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Actual Duration</span>
                    <span className="font-mono font-bold text-purple-700">{workOrder.actualDurationMinutes || 0} mins</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Actual Start</span>
                    <span className="font-mono text-gray-800">
                      {workOrder.actualStartDate ? new Date(workOrder.actualStartDate).toLocaleString() : 'Not started'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-medium">Actual Completion</span>
                    <span className="font-mono text-gray-800">
                      {workOrder.actualEndDate ? new Date(workOrder.actualEndDate).toLocaleString() : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Notes / Log */}
              {workOrder.notes && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Operational Notes & Obstacles Log</span>
                  </div>
                  <pre className="text-xs text-amber-900 whitespace-pre-wrap font-sans leading-relaxed">
                    {workOrder.notes}
                  </pre>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          {workOrder && onOpenExecution && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExecution(workOrder);
              }}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Shop Floor View</span>
            </button>
          )}

          <div className="ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetails;
