import React, { useEffect } from 'react';
import { useSocketContext } from '../../context/SocketContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  X,
  Clock,
  Trash2,
  Boxes,
  Factory,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

/**
 * RealtimeNotification Toast & Notification Center Component
 * Displays real-time operational notifications received via Socket.IO events.
 *
 * User-friendly messages without technical database ObjectIds or raw JSON payloads.
 */
export const RealtimeNotification = ({
  autoDismiss = true,
  dismissTimeout = 6000,
  maxVisibleToasts = 3,
  className = '',
}) => {
  const { notifications, dismissNotification, clearNotifications } = useSocketContext();

  // Auto-dismiss oldest visible toast after timeout
  useEffect(() => {
    if (!autoDismiss || notifications.length === 0) return;

    const latest = notifications[0];
    if (!latest) return;

    const timer = setTimeout(() => {
      dismissNotification(latest.id);
    }, dismissTimeout);

    return () => clearTimeout(timer);
  }, [notifications, autoDismiss, dismissTimeout, dismissNotification]);

  if (!notifications || notifications.length === 0) return null;

  const visibleToasts = notifications.slice(0, maxVisibleToasts);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'mo':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'wo':
        return <Factory className="w-4 h-4 text-purple-600" />;
      case 'stock':
        return <Boxes className="w-4 h-4 text-amber-600" />;
      case 'analytics':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white text-emerald-950 shadow-md';
      case 'warning':
        return 'border-amber-200 bg-white text-amber-950 shadow-md';
      case 'error':
        return 'border-rose-200 bg-white text-rose-950 shadow-md';
      default:
        return 'border-blue-200 bg-white text-gray-950 shadow-md';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'error':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none ${className}`}
    >
      {/* Notifications Header Pill if multiple */}
      {notifications.length > 1 && (
        <div className="pointer-events-auto self-end flex items-center gap-2 bg-gray-900/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[11px] font-semibold shadow-md">
          <Bell className="w-3 h-3 text-blue-400" />
          <span>{notifications.length} Real-Time Updates</span>
          <button
            type="button"
            onClick={clearNotifications}
            className="ml-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Clear all real-time notifications"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Visible Real-time Toast Cards */}
      {visibleToasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto p-3.5 rounded-2xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${getTypeStyle(
            item.type
          )}`}
        >
          {/* Category Icon Wrapper */}
          <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0 mt-0.5">
            {getCategoryIcon(item.category)}
          </div>

          {/* Toast Message Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-900 truncate">
                {item.title}
              </span>
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${getTypeBadge(
                  item.type
                )}`}
              >
                {item.category}
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              {item.message}
            </p>

            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5 font-mono">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => dismissNotification(item.id)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RealtimeNotification;
