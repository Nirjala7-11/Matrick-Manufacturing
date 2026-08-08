import { io } from 'socket.io-client';

/**
 * Socket.IO Constants matching Backend Server Configuration
 */
export const SOCKET_EVENTS = {
  // Manufacturing Order Events
  MO_CREATED: 'manufacturing:mo:created',
  MO_UPDATED: 'manufacturing:mo:updated',
  MO_STARTED: 'manufacturing:mo:started',
  MO_COMPLETED: 'manufacturing:mo:completed',
  MO_CANCELLED: 'manufacturing:mo:cancelled',

  // Work Order Events
  WO_CREATED: 'manufacturing:work-order:created',
  WO_STARTED: 'manufacturing:work-order:started',
  WO_COMPLETED: 'manufacturing:work-order:completed',
  WO_BLOCKED: 'manufacturing:work-order:blocked',

  // Stock & Inventory Events
  STOCK_CONSUMED: 'manufacturing:stock:consumed',
  STOCK_PRODUCED: 'manufacturing:stock:produced',
  PRODUCTION_UPDATED: 'manufacturing:production:updated',

  // Analytics Events
  ANALYTICS_UPDATED: 'analytics:updated',
};

export const SOCKET_ROOM_EVENTS = {
  JOIN_MANUFACTURING: 'joinManufacturing',
  LEAVE_MANUFACTURING: 'leaveManufacturing',
  JOIN_MO: 'joinMO',
  LEAVE_MO: 'leaveMO',
  JOIN_WORK_ORDER: 'joinWorkOrder',
  LEAVE_WORK_ORDER: 'leaveWorkOrder',
  JOIN_WORK_CENTER: 'joinWorkCenter',
  LEAVE_WORK_CENTER: 'leaveWorkCenter',
  JOIN_ANALYTICS: 'joinAnalytics',
  LEAVE_ANALYTICS: 'leaveAnalytics',
};

let socketInstance = null;
let connectionListeners = new Set();

/**
 * Retrieve active auth token from localStorage or cookie
 */
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  const token =
    localStorage.getItem('mms_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token');

  if (token) return token;

  // Fallback: Check cookies for token=...
  const match = document.cookie.match(/(?:^|; )\s*token\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Determine Socket Server URL
 */
const getSocketServerUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

/**
 * Initialize Socket.IO Client Connection
 * Configures auth payload, reconnection strategy, and event handlers.
 */
export const initializeSocket = (customToken = null, options = {}) => {
  if (socketInstance) {
    if (socketInstance.connected) {
      return socketInstance;
    }
    socketInstance.connect();
    return socketInstance;
  }

  const token = customToken || getAuthToken();
  const serverUrl = getSocketServerUrl();

  socketInstance = io(serverUrl, {
    path: '/socket.io/',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    auth: {
      token: token || '',
    },
    extraHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    ...options,
  });

  // Setup Lifecycle Event Listeners
  socketInstance.on('connect', () => {
    notifyConnectionStateChange('connected');
  });

  socketInstance.on('disconnect', (reason) => {
    notifyConnectionStateChange('disconnected', reason);
  });

  socketInstance.on('connect_error', (error) => {
    notifyConnectionStateChange('error', error?.message || 'Connection error');
  });

  socketInstance.io.on('reconnect_attempt', (attempt) => {
    notifyConnectionStateChange('reconnecting', `Attempt ${attempt}`);
  });

  socketInstance.io.on('reconnect_failed', () => {
    notifyConnectionStateChange('error', 'Reconnection failed');
  });

  return socketInstance;
};

/**
 * Disconnect and Destroy Socket Instance
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    notifyConnectionStateChange('disconnected', 'Client manual disconnect');
  }
};

/**
 * Get Socket Instance
 */
export const getSocket = () => socketInstance;

/**
 * Check Connection Status
 */
export const isConnected = () => {
  return Boolean(socketInstance && socketInstance.connected);
};

/**
 * Notify connection listeners of state change
 */
const notifyConnectionStateChange = (status, details = null) => {
  connectionListeners.forEach((listener) => {
    try {
      listener({
        connected: status === 'connected',
        status,
        details,
        socketId: socketInstance?.id || null,
      });
    } catch (e) {
      console.error('[SocketService] Listener error:', e);
    }
  });
};

/**
 * Register Connection State Listener
 */
export const onConnectionChange = (callback) => {
  if (typeof callback !== 'function') return () => {};
  connectionListeners.add(callback);

  // Immediately invoke with current state
  callback({
    connected: isConnected(),
    status: isConnected() ? 'connected' : 'disconnected',
    details: null,
    socketId: socketInstance?.id || null,
  });

  return () => {
    connectionListeners.delete(callback);
  };
};

/**
 * Subscribe to specific Socket Event
 */
export const subscribe = (eventName, callback) => {
  if (!eventName || typeof callback !== 'function') return () => {};

  const socket = socketInstance || initializeSocket();
  socket.on(eventName, callback);

  return () => {
    if (socket) {
      socket.off(eventName, callback);
    }
  };
};

/**
 * Unsubscribe from specific Socket Event
 */
export const unsubscribe = (eventName, callback) => {
  if (socketInstance && eventName) {
    if (callback) {
      socketInstance.off(eventName, callback);
    } else {
      socketInstance.off(eventName);
    }
  }
};

/**
 * Emit Socket Event with optional Acknowledgement
 */
export const emit = (eventName, payload, ackCallback) => {
  const socket = socketInstance || initializeSocket();
  if (!socket) return;

  if (typeof ackCallback === 'function') {
    socket.emit(eventName, payload, ackCallback);
  } else {
    socket.emit(eventName, payload);
  }
};

// ==================================================
// BACKEND ROOM SUBSCRIPTION HELPERS
// ==================================================

export const joinManufacturing = (ackCallback) => {
  emit(SOCKET_ROOM_EVENTS.JOIN_MANUFACTURING, {}, ackCallback);
};

export const leaveManufacturing = (ackCallback) => {
  emit(SOCKET_ROOM_EVENTS.LEAVE_MANUFACTURING, {}, ackCallback);
};

export const joinMO = (moId, ackCallback) => {
  if (!moId) return;
  emit(SOCKET_ROOM_EVENTS.JOIN_MO, { moId }, ackCallback);
};

export const leaveMO = (moId, ackCallback) => {
  if (!moId) return;
  emit(SOCKET_ROOM_EVENTS.LEAVE_MO, { moId }, ackCallback);
};

export const joinWorkOrder = (workOrderId, ackCallback) => {
  if (!workOrderId) return;
  emit(SOCKET_ROOM_EVENTS.JOIN_WORK_ORDER, { workOrderId }, ackCallback);
};

export const leaveWorkOrder = (workOrderId, ackCallback) => {
  if (!workOrderId) return;
  emit(SOCKET_ROOM_EVENTS.LEAVE_WORK_ORDER, { workOrderId }, ackCallback);
};

export const joinWorkCenter = (workCenterId, ackCallback) => {
  if (!workCenterId) return;
  emit(SOCKET_ROOM_EVENTS.JOIN_WORK_CENTER, { workCenterId }, ackCallback);
};

export const leaveWorkCenter = (workCenterId, ackCallback) => {
  if (!workCenterId) return;
  emit(SOCKET_ROOM_EVENTS.LEAVE_WORK_CENTER, { workCenterId }, ackCallback);
};

export const joinAnalytics = (ackCallback) => {
  emit(SOCKET_ROOM_EVENTS.JOIN_ANALYTICS, {}, ackCallback);
};

export const leaveAnalytics = (ackCallback) => {
  emit(SOCKET_ROOM_EVENTS.LEAVE_ANALYTICS, {}, ackCallback);
};

export const socketService = {
  initializeSocket,
  disconnectSocket,
  getSocket,
  isConnected,
  onConnectionChange,
  subscribe,
  unsubscribe,
  emit,
  joinManufacturing,
  leaveManufacturing,
  joinMO,
  leaveMO,
  joinWorkOrder,
  leaveWorkOrder,
  joinWorkCenter,
  leaveWorkCenter,
  joinAnalytics,
  leaveAnalytics,
  SOCKET_EVENTS,
  SOCKET_ROOM_EVENTS,
};

export default socketService;
