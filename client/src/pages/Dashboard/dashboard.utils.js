/**
 * Formatting and Helper Utilities for Manufacturing Dashboard
 */

/**
 * Format numbers with thousands separators and optional fixed decimal places.
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format ISO or YYYY-MM-DD date strings into human-readable dates.
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format duration in minutes into hours and minutes string (e.g. "4h 30m").
 */
export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '0m';
  }
  const mins = Math.max(0, Math.round(Number(minutes)));
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

/**
 * Normalize status strings for UI display (e.g., "in_progress" -> "In Progress").
 */
export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  const str = String(status).trim();
  switch (str.toLowerCase()) {
    case 'in_progress':
      return 'In Progress';
    case 'partially_available':
      return 'Partially Available';
    case 'ready':
      return 'Ready';
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
    case 'done':
      return 'Completed';
    case 'draft':
      return 'Draft';
    case 'cancelled':
      return 'Cancelled';
    case 'blocked':
      return 'Blocked';
    case 'available':
      return 'Available';
    case 'insufficient':
      return 'Insufficient';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    default:
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }
};

/**
 * Determine CSS class for status badges.
 */
export const getStatusBadgeClass = (status) => {
  if (!status) return 'mms-badge-secondary';
  const str = String(status).toLowerCase();
  switch (str) {
    case 'completed':
    case 'done':
    case 'available':
    case 'active':
      return 'mms-badge-success';
    case 'in_progress':
    case 'confirmed':
    case 'ready':
      return 'mms-badge-primary';
    case 'draft':
    case 'pending':
      return 'mms-badge-warning';
    case 'blocked':
    case 'insufficient':
    case 'cancelled':
      return 'mms-badge-danger';
    case 'partially_available':
      return 'mms-badge-info';
    default:
      return 'mms-badge-secondary';
  }
};

/**
 * Calculate delay object for Manufacturing Order display.
 */
export const calculateDisplayDelay = (plannedEnd, actualEnd, status) => {
  if (!plannedEnd) {
    return { isDelayed: false, label: 'No Schedule' };
  }

  const planned = new Date(plannedEnd);
  if (isNaN(planned.getTime())) {
    return { isDelayed: false, label: 'Invalid Date' };
  }

  const now = new Date();
  let delayMs = 0;
  let isDelayed = false;

  if (status === 'completed' || status === 'done') {
    if (actualEnd) {
      const actual = new Date(actualEnd);
      if (!isNaN(actual.getTime()) && actual > planned) {
        isDelayed = true;
        delayMs = actual.getTime() - planned.getTime();
      }
    }
  } else if (['draft', 'confirmed', 'in_progress'].includes(String(status).toLowerCase())) {
    if (now > planned) {
      isDelayed = true;
      delayMs = now.getTime() - planned.getTime();
    }
  }

  if (isDelayed) {
    const hours = Math.round(delayMs / (1000 * 60 * 60));
    if (hours < 24) {
      return { isDelayed: true, label: `${hours}h Delayed` };
    }
    const days = Math.round((hours / 24) * 10) / 10;
    return { isDelayed: true, label: `${days}d Delayed` };
  }

  return { isDelayed: false, label: 'On Schedule' };
};

export const dashboardUtils = {
  formatNumber,
  formatDate,
  formatDuration,
  formatStatus,
  getStatusBadgeClass,
  calculateDisplayDelay,
};

export default dashboardUtils;
