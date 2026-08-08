import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import socketService, {
  SOCKET_EVENTS,
  SOCKET_ROOM_EVENTS,
} from '../services/socket.service';

const SocketContext = createContext(null);

/**
 * SocketProvider Component
 * Manages global Socket.IO connection lifecycle, rooms, and real-time operational notifications.
 */
export const SocketProvider = ({ children, token = null }) => {
  const [connectionState, setConnectionState] = useState({
    connected: false,
    status: 'disconnected',
    details: null,
    socketId: null,
  });

  const [notifications, setNotifications] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  // Initialize Socket connection on mount / token change
  useEffect(() => {
    const socket = socketService.initializeSocket(token);

    // Subscribe to connection lifecycle updates
    const unsubscribeConn = socketService.onConnectionChange((state) => {
      setConnectionState(state);

      // Auto-join base manufacturing and analytics rooms when connected
      if (state.connected) {
        socketService.joinManufacturing((res) => {
          if (res?.success) {
            console.debug('[SocketContext] Joined manufacturing:all room');
          }
        });
        socketService.joinAnalytics((res) => {
          if (res?.success) {
            console.debug('[SocketContext] Joined analytics room');
          }
        });
      }
    });

    return () => {
      unsubscribeConn();
      socketService.disconnectSocket();
    };
  }, [token]);

  /**
   * Add operational notification derived from real-time events
   */
  const addNotification = useCallback((event, data) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let title = 'System Update';
    let message = 'An operational update was received.';
    let type = 'info'; // 'info' | 'success' | 'warning' | 'error'
    let category = 'manufacturing'; // 'mo' | 'wo' | 'stock' | 'analytics'

    switch (event) {
      case SOCKET_EVENTS.MO_CREATED:
        title = 'Manufacturing Order Created';
        message = `MO #${data.moNumber || 'New'} was successfully created.`;
        type = 'info';
        category = 'mo';
        break;
      case SOCKET_EVENTS.MO_UPDATED:
        title = 'Manufacturing Order Updated';
        message = `MO #${data.moNumber || ''} status updated to ${data.status || 'Updated'}.`;
        type = 'info';
        category = 'mo';
        break;
      case SOCKET_EVENTS.MO_STARTED:
        title = 'Manufacturing Order Started';
        message = `Production started for MO #${data.moNumber || ''}.`;
        type = 'info';
        category = 'mo';
        break;
      case SOCKET_EVENTS.MO_COMPLETED:
        title = 'Manufacturing Order Completed';
        message = `MO #${data.moNumber || ''} has been completed!`;
        type = 'success';
        category = 'mo';
        break;
      case SOCKET_EVENTS.MO_CANCELLED:
        title = 'Manufacturing Order Cancelled';
        message = `MO #${data.moNumber || ''} was cancelled.`;
        type = 'warning';
        category = 'mo';
        break;

      case SOCKET_EVENTS.WO_CREATED:
        title = 'Work Order Created';
        message = `Work Order ${data.workOrderNumber || ''} (${data.operationName || 'Operation'}) created.`;
        type = 'info';
        category = 'wo';
        break;
      case SOCKET_EVENTS.WO_STARTED:
        title = 'Work Order Started';
        message = `Work Order ${data.workOrderNumber || ''} operation in progress.`;
        type = 'info';
        category = 'wo';
        break;
      case SOCKET_EVENTS.WO_COMPLETED:
        title = 'Work Order Completed';
        message = `Work Order ${data.workOrderNumber || ''} finished successfully.`;
        type = 'success';
        category = 'wo';
        break;
      case SOCKET_EVENTS.WO_BLOCKED:
        title = 'Work Order Blocked';
        message = `Work Order ${data.workOrderNumber || ''} was marked as blocked.`;
        type = 'error';
        category = 'wo';
        break;

      case SOCKET_EVENTS.STOCK_CONSUMED:
        title = 'Stock Consumed';
        message = `Raw material stock consumed: ${data.quantity || 0} units.`;
        type = 'info';
        category = 'stock';
        break;
      case SOCKET_EVENTS.STOCK_PRODUCED:
        title = 'Finished Goods Produced';
        message = `Production finished goods recorded: ${data.quantity || 0} units.`;
        type = 'success';
        category = 'stock';
        break;

      case SOCKET_EVENTS.ANALYTICS_UPDATED:
        title = 'Analytics Refreshed';
        message = `Manufacturing KPI analytics metrics updated (${data.type || 'data_refresh'}).`;
        type = 'info';
        category = 'analytics';
        break;

      default:
        title = 'Real-time Event';
        message = 'New manufacturing operational data available.';
    }

    const notificationItem = {
      id,
      title,
      message,
      type,
      category,
      event,
      timestamp: new Date().toISOString(),
      raw: data,
    };

    setLastEvent({ event, data, timestamp: new Date().toISOString() });
    setNotifications((prev) => [notificationItem, ...prev].slice(0, 15));
  }, []);

  // Global Event Listener Handlers for Notifications
  useEffect(() => {
    const unsubscribes = [];

    Object.values(SOCKET_EVENTS).forEach((eventName) => {
      const unsub = socketService.subscribe(eventName, (payload) => {
        const data = payload?.data || payload || {};
        addNotification(eventName, data);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [addNotification]);

  /**
   * Helper method to dismiss notification by ID
   */
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Helper method to clear all notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Subscribe to Socket Event
   */
  const subscribe = useCallback((eventName, handler) => {
    return socketService.subscribe(eventName, handler);
  }, []);

  /**
   * Unsubscribe from Socket Event
   */
  const unsubscribe = useCallback((eventName, handler) => {
    socketService.unsubscribe(eventName, handler);
  }, []);

  /**
   * Join Dynamic Room (MO, Work Order, Work Center, Analytics)
   */
  const joinRoom = useCallback((roomType, roomId, ackCallback) => {
    switch (roomType) {
      case 'manufacturing':
        socketService.joinManufacturing(ackCallback);
        break;
      case 'mo':
        socketService.joinMO(roomId, ackCallback);
        break;
      case 'workOrder':
        socketService.joinWorkOrder(roomId, ackCallback);
        break;
      case 'workCenter':
        socketService.joinWorkCenter(roomId, ackCallback);
        break;
      case 'analytics':
        socketService.joinAnalytics(ackCallback);
        break;
      default:
        console.warn(`[SocketContext] Unknown room type: ${roomType}`);
    }
  }, []);

  /**
   * Leave Dynamic Room
   */
  const leaveRoom = useCallback((roomType, roomId, ackCallback) => {
    switch (roomType) {
      case 'manufacturing':
        socketService.leaveManufacturing(ackCallback);
        break;
      case 'mo':
        socketService.leaveMO(roomId, ackCallback);
        break;
      case 'workOrder':
        socketService.leaveWorkOrder(roomId, ackCallback);
        break;
      case 'workCenter':
        socketService.leaveWorkCenter(roomId, ackCallback);
        break;
      case 'analytics':
        socketService.leaveAnalytics(ackCallback);
        break;
      default:
        console.warn(`[SocketContext] Unknown room type: ${roomType}`);
    }
  }, []);

  /**
   * Reconnect Socket manually
   */
  const reconnect = useCallback(() => {
    socketService.disconnectSocket();
    socketService.initializeSocket(token);
  }, [token]);

  const value = useMemo(
    () => ({
      socket: socketService.getSocket(),
      connected: connectionState.connected,
      connecting: connectionState.status === 'reconnecting',
      status: connectionState.status,
      connectionError: connectionState.status === 'error' ? connectionState.details : null,
      socketId: connectionState.socketId,
      notifications,
      lastEvent,
      subscribe,
      unsubscribe,
      joinRoom,
      leaveRoom,
      dismissNotification,
      clearNotifications,
      reconnect,
    }),
    [
      connectionState,
      notifications,
      lastEvent,
      subscribe,
      unsubscribe,
      joinRoom,
      leaveRoom,
      dismissNotification,
      clearNotifications,
      reconnect,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

/**
 * Hook to access SocketContext
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const useSocket = () => {
  const context = useSocketContext();
  return context?.socket;
};

export default SocketContext;
