import React from 'react';
import {
  PackageCheck,
  Flame,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

/**
 * StockMovementBadge
 * Renders an accessible, high-visibility badge for inventory stock movement types.
 * Does not rely solely on color; includes text labels and distinct icons.
 *
 * Supported movement types:
 * - FINISHED_GOODS_PRODUCTION
 * - RAW_MATERIAL_CONSUMPTION
 * - IN
 * - OUT
 * - ADJUSTMENT
 */
export const StockMovementBadge = ({ value, size = 'md', className = '' }) => {
  const movement = (value || '').toUpperCase();

  let label = movement || 'UNKNOWN';
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-300';
  let Icon = HelpCircle;

  switch (movement) {
    case 'FINISHED_GOODS_PRODUCTION':
      label = 'Finished Goods Production';
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      Icon = PackageCheck;
      break;

    case 'RAW_MATERIAL_CONSUMPTION':
      label = 'Raw Material Consumption';
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
      Icon = Flame;
      break;

    case 'IN':
      label = 'Stock Receipt (IN)';
      badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200/80';
      Icon = ArrowDownLeft;
      break;

    case 'OUT':
      label = 'Stock Issue (OUT)';
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200/80';
      Icon = ArrowUpRight;
      break;

    case 'ADJUSTMENT':
      label = 'Manual Adjustment';
      badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200/80';
      Icon = RefreshCw;
      break;

    default:
      label = value || 'Movement';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-xs font-bold gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full shrink-0 ${badgeStyle} ${sizeClasses} ${className}`}
      title={`Movement Type: ${label}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{label}</span>
    </span>
  );
};

export default StockMovementBadge;
