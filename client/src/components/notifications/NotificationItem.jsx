import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Clock, Check } from 'lucide-react';

/**
 * Single Notification Item Component
 */
export const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const { id, title, message, type, category, timestamp, read } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-150 flex items-start gap-3 ${
        read
          ? 'bg-gray-50 border-gray-200 text-gray-600'
          : 'bg-white border-blue-200 shadow-sm text-gray-900 border-l-4 border-l-blue-600'
      }`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {category || 'System'}
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </span>
        </div>
        <h4 className={`text-sm font-medium mt-0.5 ${read ? 'text-gray-700' : 'text-gray-900'}`}>
          {title}
        </h4>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">{message}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!read && (
          <button
            onClick={() => onMarkRead(id)}
            title="Mark as read"
            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
