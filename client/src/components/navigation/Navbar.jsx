import React, { useState } from 'react';
import { ConnectionStatus } from '../realtime/ConnectionStatus';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ROLE_LABELS, ROLE_BADGES } from '../../config/roles';
import {
  Menu,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Bell,
  Factory,
} from 'lucide-react';

/**
 * Navbar Component
 * Header navigation bar providing user context, socket status, responsive toggle, notifications, and profile menu.
 */
export const Navbar = ({
  user,
  onLogout,
  toggleSidebar,
  isSidebarOpen,
  pageTitle = 'Manufacturing System',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userRole = user?.role || 'operator';
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const roleBadgeStyle = ROLE_BADGES[userRole] || 'bg-slate-100 text-slate-700';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left Area: Sidebar Toggle & Page Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
              {pageTitle}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Matrick Manufacturing Cloud
            </p>
          </div>
        </div>
      </div>

      {/* Right Area: Real-Time Socket Status & User Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Real-time Socket Connection Status Pill */}
        <ConnectionStatus showDetailsPopover={true} />

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={() => setNotifOpen((prev) => !prev)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer relative"
          title="Notification Center"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Notification Center Drawer Panel */}
        <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* User Profile Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-label="User profile menu"
          >
            {/* User Avatar Initials */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {getInitials(user?.name || user?.email)}
            </div>

            {/* Name and Role Label (Hidden on small mobile) */}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">{roleLabel}</span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Summary Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${roleBadgeStyle}`}
                  >
                    <Shield className="w-3 h-3" />
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout && onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
