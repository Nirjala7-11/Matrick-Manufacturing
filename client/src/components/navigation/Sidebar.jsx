import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationSections } from './NavigationConfig';
import { hasRole, ROLE_LABELS, ROLE_BADGES } from '../../config/roles';
import { Factory, X, ShieldCheck, Box } from 'lucide-react';

/**
 * Sidebar Component
 * Main ERP navigation drawer supporting role-based menu filtering and responsive layouts.
 */
export const Sidebar = ({
  userRole = 'operator',
  isOpen = true,
  onCloseMobile,
}) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 text-white font-extrabold text-base tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Factory className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight text-white">Matrick</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                Manufacturing
              </span>
            </div>
          </NavLink>

          {/* Close Mobile Drawer Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items Grouped by Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationSections.map((section, idx) => {
            // Filter section items according to user role
            const visibleItems = section.items.filter((item) =>
              hasRole(userRole, item.roles)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {/* Section Header */}
                <h2 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {section.title}
                </h2>

                {/* Section Navigation Links */}
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm font-bold'
                              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComponent
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-blue-400'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Role Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 font-medium">Access Tier</span>
              <span className="text-xs font-bold text-slate-200 truncate capitalize">
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
