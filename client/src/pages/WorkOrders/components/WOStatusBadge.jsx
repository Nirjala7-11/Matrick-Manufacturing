import React from 'react';
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  XCircle,
  Hourglass,
  HelpCircle,
} from 'lucide-react';

/**
 * WOStatusBadge - Displays Work Order status with accessible visual indicators.
 * Supported statuses from backend WorkOrder model:
 * - 'pending'
 * - 'ready'
 * - 'in_progress'
 * - 'completed'
 * - 'blocked'
 * - 'cancelled'
 */
export const WOStatusBadge = ({ value, size = 'md', className = '' }) => {
  const statusKey = (value || '').toLowerCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-bold',
  }[size] || 'px-2.5 py-1 text-xs';

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  const configMap = {
    pending: {
      label: 'Pending',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Hourglass,
    },
    ready: {
      label: 'Ready',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
      icon: PlayCircle,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
    },
    blocked: {
      label: 'Blocked',
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: AlertTriangle,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-gray-100 text-gray-500 border-gray-300',
      icon: XCircle,
    },
  };

  const config = configMap[statusKey] || {
    label: value || 'Unknown',
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: HelpCircle,
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full shrink-0 ${config.bg} ${sizeClasses} ${className}`}
    >
      <IconComponent className={`${iconSizes} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default WOStatusBadge;
