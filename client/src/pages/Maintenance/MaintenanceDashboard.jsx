import React, { useState, useEffect } from 'react';
import { MaintenanceMetrics } from './components/MaintenanceMetrics';
import { MaintenanceTable } from './components/MaintenanceTable';
import { DowntimeChart } from './components/DowntimeChart';
import { Wrench, Info } from 'lucide-react';
import './MaintenanceDashboard.css';

/**
 * Enterprise Maintenance & Machinery Dashboard Page
 */
export const MaintenanceDashboard = () => {
  const [oeeData, setOeeData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [downtimeData, setDowntimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch maintenance data if supported by backend API
    const fetchMaintenanceData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/maintenance/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          setOeeData(json.data?.oee || null);
          setRequests(json.data?.requests || []);
          setDowntimeData(json.data?.downtime || null);
        } else {
          setOeeData(null);
          setRequests([]);
          setDowntimeData(null);
        }
      } catch (err) {
        console.warn('Maintenance API fetch notice: Backend maintenance endpoints not provisioned.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceData();
  }, []);

  return (
    <div className="maintenance-dashboard p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Maintenance & Equipment</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Work center availability, machine downtime analytics, maintenance history.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
          <Info className="w-4 h-4 text-gray-400" />
          Backend API Source Verification Enabled
        </div>
      </div>

      {/* OEE Metrics */}
      <MaintenanceMetrics oeeData={oeeData} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MaintenanceTable requests={requests} />
        </div>
        <div>
          <DowntimeChart downtimeData={downtimeData} />
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
