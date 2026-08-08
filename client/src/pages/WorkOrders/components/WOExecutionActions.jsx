import React, { useState } from 'react';
import axios from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  AlertOctagon,
  X,
} from 'lucide-react';

/**
 * WOExecutionActions - Renders authoritative shop-floor workflow execution actions.
 * Interacts directly with backend state machine endpoints:
 * - POST /api/work-orders/:id/start
 * - POST /api/work-orders/:id/complete
 * - POST /api/work-orders/:id/block
 * - POST /api/work-orders/:id/cancel
 */
export const WOExecutionActions = ({
  workOrder,
  onActionSuccess,
  layout = 'standard', // 'standard' or 'shopfloor'
  className = '',
}) => {
  const [loadingAction, setLoadingAction] = useState(null); // 'start' | 'complete' | 'block' | 'cancel'
  const [error, setError] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  if (!workOrder) return null;

  const id = workOrder._id || workOrder.id;
  const status = workOrder.status || 'pending';
  const baseUrl = endpoints?.workOrders?.list || '/work-orders';

  // Handle Start
  const handleStart = async () => {
    setLoadingAction('start');
    setError(null);
    try {
      const response = await axios.post(`${baseUrl}/${id}/start`);
      if (onActionSuccess) {
        onActionSuccess(response?.data?.data || workOrder, 'started');
      }
    } catch (err) {
      console.error('Error starting Work Order:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to start Work Order execution.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Complete
  const handleComplete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to mark Work Order #${workOrder.woNumber} completed? Next operation in sequence will be prepared.`
      )
    ) {
      return;
    }

    setLoadingAction('complete');
    setError(null);
    try {
      const response = await axios.post(`${baseUrl}/${id}/complete`);
      if (onActionSuccess) {
        onActionSuccess(response?.data?.data || workOrder, 'completed');
      }
    } catch (err) {
      console.error('Error completing Work Order:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to complete Work Order execution.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Block Submission
  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim()) {
      setError('Please provide a reason for blocking this Work Order.');
      return;
    }

    setLoadingAction('block');
    setError(null);
    try {
      const response = await axios.post(`${baseUrl}/${id}/block`, {
        reason: blockReason.trim(),
      });
      setShowBlockModal(false);
      setBlockReason('');
      if (onActionSuccess) {
        onActionSuccess(response?.data?.data || workOrder, 'blocked');
      }
    } catch (err) {
      console.error('Error blocking Work Order:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to block Work Order.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (
      !window.confirm(
        `Are you sure you want to cancel Work Order #${workOrder.woNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoadingAction('cancel');
    setError(null);
    try {
      const response = await axios.post(`${baseUrl}/${id}/cancel`);
      if (onActionSuccess) {
        onActionSuccess(response?.data?.data || workOrder, 'cancelled');
      }
    } catch (err) {
      console.error('Error cancelling Work Order:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to cancel Work Order.');
    } finally {
      setLoadingAction(null);
    }
  };

  const isShopfloor = layout === 'shopfloor';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Error Message */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Buttons Container */}
      <div className={`flex flex-wrap items-center gap-3 ${isShopfloor ? 'w-full' : ''}`}>
        {/* START ACTION: Valid when pending, ready, or blocked */}
        {['pending', 'ready', 'blocked'].includes(status) && (
          <button
            type="button"
            onClick={handleStart}
            disabled={!!loadingAction}
            className={`flex items-center justify-center gap-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isShopfloor ? 'flex-1 py-4 text-base' : 'px-4 py-2 text-xs'
            }`}
          >
            {loadingAction === 'start' ? (
              <Loader2 className={`${isShopfloor ? 'w-6 h-6' : 'w-4 h-4'} animate-spin`} />
            ) : (
              <Play className={`${isShopfloor ? 'w-5 h-5' : 'w-4 h-4'} fill-white`} />
            )}
            <span>{status === 'blocked' ? 'Unblock & Resume' : 'Start Operation'}</span>
          </button>
        )}

        {/* COMPLETE ACTION: Valid when in_progress */}
        {status === 'in_progress' && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={!!loadingAction}
            className={`flex items-center justify-center gap-2 font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isShopfloor ? 'flex-1 py-4 text-base' : 'px-4 py-2 text-xs'
            }`}
          >
            {loadingAction === 'complete' ? (
              <Loader2 className={`${isShopfloor ? 'w-6 h-6' : 'w-4 h-4'} animate-spin`} />
            ) : (
              <CheckCircle2 className={`${isShopfloor ? 'w-5 h-5' : 'w-4 h-4'}`} />
            )}
            <span>Complete Operation</span>
          </button>
        )}

        {/* BLOCK ACTION: Valid when in_progress, pending, or ready */}
        {['in_progress', 'pending', 'ready'].includes(status) && (
          <button
            type="button"
            onClick={() => setShowBlockModal(true)}
            disabled={!!loadingAction}
            className={`flex items-center justify-center gap-2 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isShopfloor ? 'px-6 py-4 text-sm' : 'px-3 py-2 text-xs'
            }`}
          >
            <AlertTriangle className={`${isShopfloor ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
            <span>Mark Blocked</span>
          </button>
        )}

        {/* CANCEL ACTION: Valid when pending, ready, in_progress, or blocked */}
        {['pending', 'ready', 'in_progress', 'blocked'].includes(status) && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={!!loadingAction}
            className={`flex items-center justify-center gap-1.5 font-medium text-gray-500 hover:text-rose-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isShopfloor ? 'px-4 py-4 text-xs' : 'px-3 py-2 text-xs'
            }`}
            title="Cancel Work Order"
          >
            {loadingAction === 'cancel' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Report Work Order Obstacle</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="p-5 space-y-4">
              <p className="text-xs text-gray-600">
                Specify the shop floor obstacle or reason for pausing operation #{workOrder.woNumber}:
              </p>

              <div>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="E.g., Tooling failure, missing raw material stock, quality check pending..."
                  className="w-full p-3 text-xs border border-gray-300 rounded-xl outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-gray-50/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'block'}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingAction === 'block' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WOExecutionActions;
