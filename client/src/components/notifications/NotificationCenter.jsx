import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X, Filter } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import {
  getStoredNotifications,
  saveNotificationsToStorage,
  formatSocketEventToNotification,
} from '../../services/notification.service';
import { useSocket } from '../../context/SocketContext';

/**
 * Notification Center Panel Component
 */
export const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'Manufacturing Order', 'Work Order', 'Inventory'
  const socket = useSocket();

  // Listen to real Socket.IO events from primary socket instance
  useEffect(() => {
    if (!socket) return;

    const eventsToListen = [
      'manufacturing:mo:created',
      'manufacturing:mo:updated',
      'manufacturing:mo:started',
      'manufacturing:mo:completed',
      'manufacturing:work-order:started',
      'manufacturing:work-order:completed',
      'manufacturing:stock:consumed',
      'manufacturing:stock:produced',
      'analytics:updated',
    ];

    const handleEvent = (eventName) => (payload) => {
      const formattedNotif = formatSocketEventToNotification(eventName, payload);
      setNotifications((prev) => {
        const updated = [formattedNotif, ...prev].slice(0, 50);
        saveNotificationsToStorage(updated);
        return updated;
      });
    };

    const cleanupFns = eventsToListen.map((evt) => {
      const handler = handleEvent(evt);
      socket.on(evt, handler);
      return () => socket.off(evt, handler);
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [socket]);

  const handleMarkRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    saveNotificationsToStorage([]);
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter !== 'all') return item.category === filter;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900 text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 border-b border-gray-100 bg-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[220px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap ${
              filter === 'unread' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Clear all"
              className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <Bell className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">Real-time manufacturing updates will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500">
        Connected to Socket.IO Production Stream
      </div>
    </div>
  );
};

export default NotificationCenter;
