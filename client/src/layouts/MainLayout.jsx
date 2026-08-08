import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Navbar from '../components/navigation/Navbar';
import RealtimeNotification from '../components/realtime/RealtimeNotification';
import getAllNavItems from '../components/navigation/NavigationConfig';

/**
 * MainLayout Component
 * Authenticated application shell wrapping header, sidebar, toast notification layer and main content.
 */
export const MainLayout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine Current Page Title dynamically from location path
  const getCurrentPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith('/dashboard')) return 'Plant Executive Dashboard';
    if (path.startsWith('/products/new')) return 'Create Product Master';
    if (path.startsWith('/products')) return 'Product Master Catalog';
    if (path.startsWith('/work-centers/new')) return 'Create Work Center';
    if (path.startsWith('/work-centers')) return 'Work Center Management';
    if (path.startsWith('/boms/new')) return 'Create Bill of Materials';
    if (path.startsWith('/boms')) return 'Bill of Materials (BOM)';
    if (path.startsWith('/manufacturing-orders/new')) return 'Create Manufacturing Order';
    if (path.startsWith('/manufacturing-orders')) return 'Manufacturing Orders';
    if (path.includes('/execution')) return 'Work Order Shop Floor Execution';
    if (path.startsWith('/work-orders')) return 'Work Order Scheduling';
    if (path.startsWith('/inventory')) return 'Inventory & Stock Ledger';
    if (path.startsWith('/analytics')) return 'OEE & Throughput Analytics';
    if (path.startsWith('/reports')) return 'Production Audit Reports';

    return 'Manufacturing Portal';
  };

  const userRole = user?.role || 'operator';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      <div className="flex flex-1 relative overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          userRole={userRole}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area Container */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Header Navbar */}
          <Navbar
            user={user}
            onLogout={onLogout}
            toggleSidebar={() => setSidebarOpen((prev) => !prev)}
            isSidebarOpen={sidebarOpen}
            pageTitle={getCurrentPageTitle()}
          />

          {/* Main View Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <Outlet />
          </main>

          {/* Footer Bar */}
          <footer className="py-4 px-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <span>&copy; {new Date().getFullYear()} Matrick Manufacturing System</span>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                <span>Real-Time Engine: Active</span>
                <span>•</span>
                <span>API Status: 200 OK</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Real-time Socket Event Notification Toast Layer */}
      <RealtimeNotification />
    </div>
  );
};

export default MainLayout;
