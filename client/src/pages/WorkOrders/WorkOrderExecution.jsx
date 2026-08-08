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
  Building,
  Box,
  AlertTriangle,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  Gauge,
  DollarSign,
  FileText,
  Flame,
  Maximize2,
} from 'lucide-react';

/**
 * WorkOrderExecution - Dedicated Shop Floor Execution Interface.
 * Designed for shop floor operators and line managers with:
 * - High visibility typography
 * - Prominent Work Center specs
 * - Large touch-friendly workflow action triggers
 * - Live execution timing metrics
 */
export const WorkOrderExecution = ({
  workOrder: initialWO,
  woId,
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const [workOrder, setWorkOrder] = useState(initialWO || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Timer state for real-time elapsed minutes counter when in_progress
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (initialWO?._id || initialWO?.id) {
        setWorkOrder(initialWO);
        fetchLatestData(initialWO._id || initialWO.id);
      } else if (woId) {
        fetchLatestData(woId);
      }
    }
  }, [isOpen, initialWO, woId]);

  const fetchLatestData = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = endpoints?.workOrders?.list || '/work-orders';
      const res = await axios.get(`${baseUrl}/${targetId}`);
      setWorkOrder(res?.data?.data || null);
    } catch (err) {
      console.error('Error fetching execution WO data:', err);
      setError(err?.response?.data?.message || 'Failed to refresh Work Order.');
    } finally {
      setLoading(false);
    }
  };

  // Live timer tick if in_progress
  useEffect(() => {
    if (!workOrder || workOrder.status !== 'in_progress' || !workOrder.actualStartDate) {
      return;
    }

    const calculateElapsed = () => {
      const startMs = new Date(workOrder.actualStartDate).getTime();
      const nowMs = Date.now();
      const diffMins = Math.max(0, Math.floor((nowMs - startMs) / 60000));
      setElapsedMinutes(diffMins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [workOrder]);

  const handleActionSuccess = (updatedWO, actionType) => {
    setWorkOrder(updatedWO);
    if (onStatusChanged) onStatusChanged(updatedWO);
  };

  if (!isOpen) return null;

  const targetWO = workOrder || initialWO || {};
  const mo = typeof targetWO.manufacturingOrder === 'object' ? targetWO.manufacturingOrder : {};
  const finishedProd = typeof mo.finishedProduct === 'object' ? mo.finishedProduct : {};
  const wc = typeof targetWO.workCenter === 'object' ? targetWO.workCenter : {};
  const operator = typeof targetWO.assignedOperator === 'object' ? targetWO.assignedOperator : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-4xl overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Shop Floor Header Bar */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-xl sm:text-2xl text-white tracking-wide">
                  {targetWO.woNumber || 'WORK ORDER'}
                </span>
                <WOStatusBadge value={targetWO.status} size="lg" />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Operation:</span>
                <strong className="text-purple-300 font-bold text-sm">
                  {targetWO.operationName || 'Shop Operation'}
                </strong>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                  Sequence #{targetWO.sequence || 1}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLatestData(targetWO._id || targetWO.id)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Shop Floor Main Display */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchLatestData(targetWO._id || targetWO.id)}
                className="font-bold underline text-rose-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Primary Action Target Zone */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 shadow-inner space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Shop Floor Execution Controls
              </span>
              <span className="text-xs font-mono text-purple-400 font-semibold">
                Authorization: Operator / Manager
              </span>
            </div>

            <WOExecutionActions
              workOrder={targetWO}
              onActionSuccess={handleActionSuccess}
              layout="shopfloor"
            />
          </div>

          {/* Real-time Operation Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Work Center Card */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Building className="w-4 h-4 shrink-0" />
                <span>Work Center</span>
              </div>
              <p className="text-lg font-black text-white">{wc.name || 'Unassigned'}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-300 font-mono">
                {wc.code && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Code:</span>
                    <span className="font-bold text-blue-300">{wc.code}</span>
                  </div>
                )}
                {wc.capacityPerHour !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacity:</span>
                    <span>{wc.capacityPerHour} pcs/hr</span>
                  </div>
                )}
                {wc.costPerHour !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate:</span>
                    <span>${wc.costPerHour}/hr</span>
                  </div>
                )}
              </div>
            </div>

            {/* Manufacturing Order & Output Goods Card */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Factory className="w-4 h-4 shrink-0" />
                <span>Parent MO & Goods</span>
              </div>
              <p className="text-base font-bold text-white font-mono">{mo.moNumber || '—'}</p>
              <p className="text-sm font-semibold text-purple-200 mt-1 truncate">
                {finishedProd.name || 'Output Goods'}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                <span>Target Batch:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {mo.quantity || 1} {finishedProd.unitOfMeasure || 'pcs'}
                </span>
              </div>
            </div>

            {/* Live Timer / Duration Card */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Duration Tracker</span>
                </span>
                {targetWO.status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold animate-pulse">
                    LIVE RUNNING
                  </span>
                )}
              </div>

              <div className="my-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-white">
                    {targetWO.status === 'in_progress'
                      ? `${elapsedMinutes}m`
                      : `${targetWO.actualDurationMinutes || 0}m`}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Planned: {targetWO.plannedDurationMinutes || 60}m
                  </span>
                </div>

                <WOProgress
                  plannedDuration={targetWO.plannedDurationMinutes}
                  actualDuration={
                    targetWO.status === 'in_progress' ? elapsedMinutes : targetWO.actualDurationMinutes
                  }
                  sequence={targetWO.sequence}
                  status={targetWO.status}
                  showDetails={false}
                  className="mt-2"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Started:{' '}
                {targetWO.actualStartDate
                  ? new Date(targetWO.actualStartDate).toLocaleTimeString()
                  : 'Not started'}
              </div>
            </div>
          </div>

          {/* Assigned Operator & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Shop Floor Line Operator
                  </span>
                  <span className="text-sm font-bold text-white">
                    {operator
                      ? `${operator.firstName || ''} ${operator.lastName || ''}`.trim() || operator.email
                      : 'Unassigned Operator'}
                  </span>
                </div>
              </div>
            </div>

            {targetWO.notes && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl text-amber-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-400 mb-1">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Obstacles & Operational Notes</span>
                </div>
                <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {targetWO.notes}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Shop Floor Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Shop Floor Terminal Connected</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Exit Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderExecution;
