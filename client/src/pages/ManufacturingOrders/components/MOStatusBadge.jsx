import React from 'react';
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  Boxes,
} from 'lucide-react';

/**
 * MOStatusBadge Component
 * Renders status, priority, and component availability badges for Manufacturing Orders
 */
export const MOStatusBadge = ({ type = 'status', value, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-bold',
  };

  // MO Status Badges
  if (type === 'status') {
    switch (value) {
      case 'draft':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
          >
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Draft</span>
          </span>
        );
      case 'confirmed':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
          >
            <Check className="w-3 h-3 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse ${sizeClasses[size]}`}
          >
            <PlayCircle className="w-3 h-3 text-amber-600" />
            <span>In Progress</span>
          </span>
        );
      case 'completed':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
          >
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses[size]}`}
          >
            {value || 'Unknown'}
          </span>
        );
    }
  }

  // Component Stock Availability Badges
  if (type === 'availability') {
    switch (value) {
      case 'available':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Stock Available</span>
          </span>
        );
      case 'partially_available':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Partially Available</span>
          </span>
        );
      case 'insufficient':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
          >
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Insufficient Stock</span>
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-gray-50 text-gray-600 border border-gray-200 ${sizeClasses[size]}`}
          >
            <Boxes className="w-3 h-3 text-gray-400" />
            <span>Not Checked</span>
          </span>
        );
    }
  }

  // Order Priority Badges
  if (type === 'priority') {
    switch (value) {
      case 'urgent':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}
          >
            <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
            <span>Urgent</span>
          </span>
        );
      case 'high':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses[size]}`}
          >
            <ArrowUp className="w-3 h-3 text-orange-600" />
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
          >
            <Minus className="w-3 h-3 text-blue-500" />
            <span>Medium</span>
          </span>
        );
      case 'low':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md font-semibold bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses[size]}`}
          >
            <ArrowDown className="w-3 h-3 text-gray-400" />
            <span>Low</span>
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md font-semibold bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses[size]}`}
          >
            {value}
          </span>
        );
    }
  }

  return null;
};

export default MOStatusBadge;
