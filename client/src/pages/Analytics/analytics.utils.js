/**
 * Analytics Presentation & Formatting Utility Helpers
 * NO business logic or metric recalculations reside here.
 * All metrics are consumed directly from backend analytics endpoints.
 */

/**
 * Format numbers with locale commas and optional decimal places
 */
export const formatMetricValue = (value, decimals = 0, fallback = '0') => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format production quantity with unit of measure
 */
export const formatQuantity = (quantity, unit = 'units') => {
  const formattedVal = formatMetricValue(quantity, 0, '0');
  return `${formattedVal} ${unit || 'units'}`;
};

/**
 * Format delay duration into readable days or hours
 */
export const formatDurationHours = (hours) => {
  if (!hours || isNaN(hours) || hours <= 0) return '0 hrs';
  if (hours >= 24) {
    const days = (hours / 24).toFixed(1);
    return `${days} days (${hours.toFixed(1)} hrs)`;
  }
  return `${hours.toFixed(1)} hrs`;
};

/**
 * Format percentage value
 */
export const formatPercentage = (pct, decimals = 1) => {
  if (pct === null || pct === undefined || isNaN(pct)) return '0%';
  return `${Number(pct).toFixed(decimals)}%`;
};

/**
 * Format date range for display subtitles
 */
export const formatDateRange = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 'All Recorded Period';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Selected Period';

  const startFormatted = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endFormatted = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} – ${endFormatted}`;
};

/**
 * Format date string to short label (e.g. "Oct 24")
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Get CSS badge styling for MO / WO status
 */
export const getStatusBadgeClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'in_progress':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'confirmed':
    case 'ready':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'draft':
    case 'pending':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'blocked':
    case 'cancelled':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

/**
 * Get delay severity color coding
 */
export const getDelaySeverityBadge = (delayDays) => {
  if (delayDays >= 7) {
    return {
      label: 'Critical Delay',
      style: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    };
  }
  if (delayDays >= 2) {
    return {
      label: 'Moderate Delay',
      style: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    };
  }
  return {
    label: 'Minor Delay',
    style: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
};

export const analyticsUtils = {
  formatMetricValue,
  formatQuantity,
  formatDurationHours,
  formatPercentage,
  formatDateRange,
  formatDateShort,
  getStatusBadgeClass,
  getDelaySeverityBadge,
};

export default analyticsUtils;
