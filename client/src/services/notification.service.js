/**
 * Notification Service
 * Handles notification formatting, in-memory/localStorage state management,
 * and integration with the primary Socket.IO connection.
 */

const STORAGE_KEY = 'mms_notifications_v1';
const MAX_NOTIFICATIONS = 50;

/**
 * Load persisted notifications from localStorage.
 */
export const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load notifications from storage:', err);
    return [];
  }
};

/**
 * Persist notifications list to localStorage.
 */
export const saveNotificationsToStorage = (notifications) => {
  try {
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to persist notifications:', err);
  }
};

/**
 * Map real Socket.IO manufacturing & analytics events to user-friendly notification objects.
 */
export const formatSocketEventToNotification = (eventName, payload) => {
  const timestamp = new Date().toISOString();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const data = payload?.data || payload || {};

  switch (eventName) {
    case 'manufacturing:mo:created':
      return {
        id,
        title: 'New Manufacturing Order',
        message: `MO ${data.moNumber || 'Created'} has been registered with status ${data.status || 'Draft'}.`,
        type: 'info',
        category: 'Manufacturing Order',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:mo:updated':
    case 'manufacturing:mo:started':
      return {
        id,
        title: 'Manufacturing Order Updated',
        message: `MO ${data.moNumber || ''} changed status to '${data.status || 'Updated'}'.`,
        type: 'warning',
        category: 'Manufacturing Order',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:mo:completed':
      return {
        id,
        title: 'Manufacturing Order Completed',
        message: `MO ${data.moNumber || ''} successfully completed production.`,
        type: 'success',
        category: 'Manufacturing Order',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:work-order:started':
      return {
        id,
        title: 'Work Order Started',
        message: `Operation '${data.operationName || 'Work Order'}' started on shop floor.`,
        type: 'info',
        category: 'Work Order',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:work-order:completed':
      return {
        id,
        title: 'Work Order Completed',
        message: `Operation '${data.operationName || 'Work Order'}' finished execution.`,
        type: 'success',
        category: 'Work Order',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:stock:consumed':
      return {
        id,
        title: 'Raw Material Consumed',
        message: `Deducted ${data.quantity || 0} unit(s) from inventory for production.`,
        type: 'warning',
        category: 'Inventory',
        timestamp,
        read: false,
        meta: data,
      };

    case 'manufacturing:stock:produced':
      return {
        id,
        title: 'Finished Goods Produced',
        message: `Credited ${data.quantity || 0} unit(s) of finished product to stock.`,
        type: 'success',
        category: 'Inventory',
        timestamp,
        read: false,
        meta: data,
      };

    case 'analytics:updated':
      return {
        id,
        title: 'Analytics Metrics Refreshed',
        message: `Production KPIs auto-synced following event '${data.type || 'activity'}'.`,
        type: 'info',
        category: 'System',
        timestamp,
        read: false,
        meta: data,
      };

    default:
      return {
        id,
        title: 'System Activity',
        message: typeof data === 'string' ? data : 'Manufacturing state update received.',
        type: 'info',
        category: 'System',
        timestamp,
        read: false,
        meta: data,
      };
  }
};

export const notificationService = {
  getStoredNotifications,
  saveNotificationsToStorage,
  formatSocketEventToNotification,
};

export default notificationService;
