import React from 'react';
import { Clock, Layers, AlertCircle, Check } from 'lucide-react';

/**
 * WOProgress - Renders duration progress and sequence step visualization.
 * Uses authoritative backend fields:
 * - plannedDurationMinutes
 * - actualDurationMinutes
 * - sequence
 * - status
 */
export const WOProgress = ({
  plannedDuration = 60,
  actualDuration = 0,
  sequence = 1,
  status = 'pending',
  showDetails = true,
  className = '',
}) => {
  const formatMinutes = (mins) => {
    if (mins === undefined || mins === null || isNaN(mins)) return '0m';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const planned = Number(plannedDuration) || 1;
  const actual = Number(actualDuration) || 0;

  // Percentage calculation based on actual vs planned duration
  let percent = 0;
  if (status === 'completed') {
    percent = 100;
  } else if (status === 'in_progress' || status === 'blocked') {
    percent = Math.min(100, Math.round((actual / planned) * 100)) || 10;
  } else if (status === 'ready') {
    percent = 0;
  }

  // Determine progress bar color theme
  let barColor = 'bg-slate-300';
  if (status === 'completed') {
    barColor = 'bg-emerald-500';
  } else if (status === 'in_progress') {
    if (actual > planned) {
      barColor = 'bg-rose-500';
    } else if (actual > planned * 0.8) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-purple-600';
    }
  } else if (status === 'blocked') {
    barColor = 'bg-rose-400';
  }

  const isOvertime = actual > planned && status !== 'pending';

  return (
    <div className={`flex flex-col gap-1 w-full max-w-xs ${className}`}>
      {/* Top Header Label */}
      {showDetails && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600 shrink-0" />
            <span>Op #{sequence}</span>
          </span>

          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            <span>
              {status === 'completed' || status === 'in_progress'
                ? `${formatMinutes(actual)} / ${formatMinutes(planned)}`
                : `${formatMinutes(planned)} planned`}
            </span>
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200 flex">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer Alert if Overtime */}
      {showDetails && isOvertime && (
        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
          <span>Exceeded planned time by {formatMinutes(actual - planned)}</span>
        </div>
      )}
    </div>
  );
};

export default WOProgress;
