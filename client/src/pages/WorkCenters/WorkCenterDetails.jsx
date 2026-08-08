import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import {
  X,
  Cpu,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit,
  DollarSign,
  Activity,
  Clock,
  Wrench,
  Loader2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

export const WorkCenterDetails = ({ workCenterId, isOpen, onClose, onEdit }) => {
  const [workCenter, setWorkCenter] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workCenterId || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setWorkCenter(null);
      setWorkOrders([]);

      try {
        const baseUrl = endpoints?.workCenters?.list || '/work-centers';
        const wcUrl = endpoints?.workCenters?.getById
          ? endpoints.workCenters.getById(workCenterId)
          : `${baseUrl}/${workCenterId}`;

        const wcRes = await axios.get(wcUrl);
        const wcData = wcRes?.data?.data || wcRes?.data;
        setWorkCenter(wcData);

        // Fetch associated work orders for this work center using existing API
        try {
          const woEndpoint = endpoints?.workOrders?.getByWorkCenter
            ? endpoints.workOrders.getByWorkCenter(workCenterId)
            : `/work-orders/work-center/${workCenterId}`;
          const woRes = await axios.get(woEndpoint);
          const woData = woRes?.data?.data || woRes?.data || [];
          setWorkOrders(Array.isArray(woData) ? woData : []);
        } catch (woErr) {
          // Non-blocking error if work orders fetch returns 404 or empty
          console.warn('Could not load work orders for work center:', woErr);
          setWorkOrders([]);
        }
      } catch (err) {
        console.error('Error fetching work center details:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load work center details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [workCenterId, isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mms-wc-status-active">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active (Online)
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mms-wc-status-maintenance">
            <Wrench className="w-3 h-3 text-amber-600" /> Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mms-wc-status-inactive">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Inactive (Offline)
          </span>
        );
    }
  };

  return (
    <div className="mms-modal-overlay" onClick={onClose}>
      <div className="mms-modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{workCenter?.name || 'Work Center Details'}</h2>
                {workCenter?.code && (
                  <span className="px-2 py-0.5 font-mono text-xs font-bold bg-gray-200 text-gray-700 rounded">
                    {workCenter.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Manufacturing Equipment & Resource Station</p>
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
              <p className="text-xs font-medium">Loading work center details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" /> Error Loading Details
              </div>
              <p>{error}</p>
            </div>
          ) : workCenter ? (
            <>
              {/* Operating Status Banner */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                    Operating State
                  </span>
                  <div className="mt-1">{getStatusBadge(workCenter.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                    Status Flag
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    {workCenter.isActive ? 'Active in Dispatch' : 'Excluded from Scheduling'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Capacity Per Hour</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {dashboardUtils.formatNumber(workCenter.capacityPerHour, 1)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">units / hr</span>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Hourly Cost Rate</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    ${dashboardUtils.formatNumber(workCenter.costPerHour, 2)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">/ hr</span>
                </div>
              </div>

              {/* Description & Technical Notes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> Equipment Description & Technical Notes
                </h3>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed min-h-[60px]">
                  {workCenter.description || (
                    <span className="text-gray-400 italic">No description provided for this work center.</span>
                  )}
                </div>
              </div>

              {/* Assigned Work Orders Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" /> Assigned Shop Floor Work Orders
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {workOrders.length} Order(s)
                  </span>
                </div>

                {workOrders.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 text-center">
                    No active or scheduled work orders currently assigned to this work center.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                          <th className="py-2.5 px-3">WO Code</th>
                          <th className="py-2.5 px-3">Operation Name</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {workOrders.slice(0, 5).map((wo) => (
                          <tr key={wo._id || wo.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-900">{wo.workOrderNumber || wo.code || 'WO'}</td>
                            <td className="py-2 px-3 text-gray-800">{wo.operationName || wo.name || 'Operation'}</td>
                            <td className="py-2 px-3 text-right font-bold">{dashboardUtils.formatNumber(wo.plannedQuantity || wo.quantity || 0)}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-50 text-blue-700">
                                {dashboardUtils.formatStatus(wo.status || 'pending')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
                <span>Created: {dashboardUtils.formatDate(workCenter.createdAt, true)}</span>
                <span>Updated: {dashboardUtils.formatDate(workCenter.updatedAt, true)}</span>
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
          {workCenter && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(workCenter);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Work Center</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkCenterDetails;
