import React, { useState } from 'react';
import { useSocketContext } from '../../context/SocketContext';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Radio } from 'lucide-react';

/**
 * ConnectionStatus Component
 * Accessible real-time socket connection status indicator for app header / navbar.
 *
 * Displays state using both text labels and visual indicators:
 * - Connected (Green pulse)
 * - Reconnecting (Amber spin)
 * - Disconnected (Gray/Red)
 */
export const ConnectionStatus = ({ showDetailsPopover = true, className = '' }) => {
  const { connected, connecting, status, connectionError, socketId, reconnect } =
    useSocketContext();

  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    if (connected) {
      return {
        bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        icon: <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
        label: 'Live Connected',
      };
    }

    if (connecting || status === 'reconnecting') {
      return {
        bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />,
        label: 'Reconnecting...',
      };
    }

    return {
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      icon: <WifiOff className="w-3.5 h-3.5 text-rose-600" />,
      label: 'Disconnected',
    };
  };

  const badge = getStatusBadge();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Connection Pill Button */}
      <button
        type="button"
        onClick={() => showDetailsPopover && setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 shadow-2xs ${badge.bgColor} hover:opacity-90 cursor-pointer`}
        title={`Socket Connection: ${badge.label}`}
        aria-label={`Real-time socket status: ${badge.label}`}
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dotColor}`}></span>
        </span>
        {badge.icon}
        <span className="text-[11px] font-bold tracking-tight">{badge.label}</span>
      </button>

      {/* Popover Card for Technical Details & Reconnect */}
      {showDetailsPopover && isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 z-50 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-gray-900">Real-Time Connection</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              ×
            </button>
          </div>

          <div className="py-3 space-y-2 text-gray-600 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="font-bold capitalize text-gray-800">{status}</span>
            </div>

            {socketId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Socket ID:</span>
                <span className="font-mono text-gray-700 truncate max-w-[120px]">
                  {socketId}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">Transport:</span>
              <span className="font-semibold text-gray-700">WebSocket / Polling</span>
            </div>

            {connectionError && (
              <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-[10px] leading-tight">{connectionError}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                reconnect();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
