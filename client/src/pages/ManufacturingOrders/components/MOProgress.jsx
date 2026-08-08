import React from 'react';
import { Check, Clock, Play, CheckCircle2, AlertOctagon } from 'lucide-react';

/**
 * MOProgress Component
 * Visual workflow tracker displaying MO lifecycle stages and progress percentages.
 */
export const MOProgress = ({ status = 'draft', workOrders = [] }) => {
  // Define standard manufacturing order workflow steps
  const steps = [
    { key: 'draft', label: 'Draft', desc: 'Order Created' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Materials Verified' },
    { key: 'in_progress', label: 'In Progress', desc: 'Shop Floor Execution' },
    { key: 'completed', label: 'Completed', desc: 'Finished Stock Posted' },
  ];

  // Calculate stage completion index
  const getStepStatus = (stepKey) => {
    if (status === 'cancelled') return 'cancelled';

    const orderMap = {
      draft: 0,
      confirmed: 1,
      in_progress: 2,
      completed: 3,
    };

    const currentIdx = orderMap[status] ?? 0;
    const stepIdx = orderMap[stepKey] ?? 0;

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  // Calculate percentage
  let percentage = 0;
  if (status === 'confirmed') percentage = 33;
  else if (status === 'in_progress') {
    if (workOrders && workOrders.length > 0) {
      const completedWOs = workOrders.filter((wo) => wo.status === 'completed').length;
      percentage = Math.min(90, Math.max(33, Math.round(33 + (completedWOs / workOrders.length) * 57)));
    } else {
      percentage = 60;
    }
  } else if (status === 'completed') percentage = 100;

  if (status === 'cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>Manufacturing Order Cancelled</span>
        </div>
        <p className="text-[11px] text-rose-600 mt-1">
          This order was cancelled prior to completion. No further stock movements or work orders active.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
      {/* Top Percentage Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-bold uppercase tracking-wider text-gray-500 text-[11px]">
          Order Execution Progress
        </span>
        <span className="font-mono font-bold text-purple-700">{percentage}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-6">
        <div
          className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Workflow Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const stepState = getStepStatus(step.key);

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-left transition-all ${
                stepState === 'completed'
                  ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                  : stepState === 'active'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-400/20'
                  : 'bg-gray-50/40 border-gray-200 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Step 0{idx + 1}
                </span>

                {stepState === 'completed' && (
                  <div className="p-1 bg-purple-600 text-white rounded-full">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                {stepState === 'active' && (
                  <div className="p-1 bg-amber-500 text-white rounded-full animate-bounce">
                    <Play className="w-3 h-3 fill-white" />
                  </div>
                )}
                {stepState === 'pending' && (
                  <div className="p-1 bg-gray-200 text-gray-500 rounded-full">
                    <Clock className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="font-bold text-xs">{step.label}</div>
              <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MOProgress;
