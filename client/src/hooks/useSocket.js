import { useEffect, useRef, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../services/socket.service';

/**
 * Primary Custom Hook for Real-time Socket Event Subscription
 *
 * Usage:
 * useSocket('manufacturing:mo:updated', (payload) => {
 *   refreshPageData();
 * });
 *
 * Automatically manages listener mounting/unmounting and prevents memory leaks.
 */
export const useSocket = (eventName, callback) => {
  const { subscribe } = useSocketContext();
  const savedCallback = useRef(callback);

  // Keep latest callback reference without triggering re-subscriptions
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!eventName || typeof savedCallback.current !== 'function') return;

    const eventHandler = (payload) => {
      if (savedCallback.current) {
        savedCallback.current(payload);
      }
    };

    const unsubscribeFn = subscribe(eventName, eventHandler);

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [eventName, subscribe]);
};

/**
 * Hook to automatically join and leave a specific socket room
 *
 * Usage:
 * useRoom('mo', selectedMoId);
 */
export const useRoom = (roomType, roomId) => {
  const { joinRoom, leaveRoom } = useSocketContext();

  useEffect(() => {
    if (!roomType) return;

    joinRoom(roomType, roomId);

    return () => {
      leaveRoom(roomType, roomId);
    };
  }, [roomType, roomId, joinRoom, leaveRoom]);
};

/**
 * Manufacturing Order Real-Time Events Hook
 *
 * Usage:
 * useManufacturingEvents({
 *   onMOCreated: (payload) => refetchOrders(),
 *   onMOUpdated: (payload) => refetchOrders(),
 * });
 */
export const useManufacturingEvents = ({
  onMOCreated,
  onMOUpdated,
  onMOStarted,
  onMOCompleted,
  onMOCancelled,
} = {}) => {
  useSocket(SOCKET_EVENTS.MO_CREATED, onMOCreated);
  useSocket(SOCKET_EVENTS.MO_UPDATED, onMOUpdated);
  useSocket(SOCKET_EVENTS.MO_STARTED, onMOStarted);
  useSocket(SOCKET_EVENTS.MO_COMPLETED, onMOCompleted);
  useSocket(SOCKET_EVENTS.MO_CANCELLED, onMOCancelled);
};

/**
 * Work Order Real-Time Events Hook
 *
 * Usage:
 * useWorkOrderEvents({
 *   onWOStarted: (payload) => refetchWorkOrders(),
 *   onWOCompleted: (payload) => refetchWorkOrders(),
 * });
 */
export const useWorkOrderEvents = ({
  onWOCreated,
  onWOStarted,
  onWOCompleted,
  onWOBlocked,
} = {}) => {
  useSocket(SOCKET_EVENTS.WO_CREATED, onWOCreated);
  useSocket(SOCKET_EVENTS.WO_STARTED, onWOStarted);
  useSocket(SOCKET_EVENTS.WO_COMPLETED, onWOCompleted);
  useSocket(SOCKET_EVENTS.WO_BLOCKED, onWOBlocked);
};

/**
 * Inventory & Stock Real-Time Events Hook
 *
 * Usage:
 * useStockEvents({
 *   onStockConsumed: (payload) => refetchStock(),
 *   onStockProduced: (payload) => refetchStock(),
 * });
 */
export const useStockEvents = ({
  onStockConsumed,
  onStockProduced,
  onProductionUpdated,
} = {}) => {
  useSocket(SOCKET_EVENTS.STOCK_CONSUMED, onStockConsumed);
  useSocket(SOCKET_EVENTS.STOCK_PRODUCED, onStockProduced);
  useSocket(SOCKET_EVENTS.PRODUCTION_UPDATED, onProductionUpdated);
};

/**
 * Analytics Trigger Hook
 *
 * Usage:
 * useAnalyticsEvents({
 *   onAnalyticsUpdated: (payload) => refetchAnalytics(),
 * });
 */
export const useAnalyticsEvents = ({ onAnalyticsUpdated } = {}) => {
  useSocket(SOCKET_EVENTS.ANALYTICS_UPDATED, onAnalyticsUpdated);
};

export default useSocket;
