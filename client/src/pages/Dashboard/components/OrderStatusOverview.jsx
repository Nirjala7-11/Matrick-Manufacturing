import React, { useState } from 'react';
import { PieChart, ShieldAlert, CheckCircle2, Clock, FileText, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../dashboard.utils';

export const OrderStatusOverview = ({ overview, loading }) => {
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-100 rounded-lg w-full"></div>
      </div>
    );
  }

  const moData = overview?.manufacturingOrders || {};
  const byStatus = moData.byStatus || {
    draft: 3,
    confirmed: 7,
    in_progress: 12,
    completed: 5,
    cancelled: 1,
  };
  const compAvailability = moData.activeComponentAvailability || {
    available: 18,
    insufficient: 2,
    partially_available: 4,
  };

  const totalOrders = moData.total || Object.values(byStatus).reduce((a, b) => a + b, 0);

  const top3Map = {
    in_progress: [
      { id: 'mo1', moNumber: 'MO-2026-001', name: 'Aluminium Enclosure X1', progress: '68% (816/1200 pcs)', priority: 'HIGH' },
      { id: 'mo4', moNumber: 'MO-2026-004', name: 'Stainless Bracket Heavy-Duty', progress: '85% (2125/2500 pcs)', priority: 'URGENT' },
      { id: 'mo9', moNumber: 'MO-2026-009', name: 'PCB Assembly Core-V2', progress: '45% (405/900 pcs)', priority: 'HIGH' },
    ],
    confirmed: [
      { id: 'mo3', moNumber: 'MO-2026-003', name: 'Lithium Battery Module 24V', progress: '20% (100/500 pcs)', priority: 'HIGH' },
      { id: 'mo10', moNumber: 'MO-2026-010', name: 'Stainless Bracket Heavy-Duty', progress: '0% (0/3000 pcs)', priority: 'MEDIUM' },
      { id: 'mo12', moNumber: 'MO-2026-012', name: 'PCB Assembly Core-V2', progress: '0% (0/500 pcs)', priority: 'MEDIUM' },
    ],
    completed: [
      { id: 'mo2', moNumber: 'MO-2026-002', name: 'PCB Assembly Core-V2', progress: '100% (800 pcs)', priority: 'MEDIUM' },
      { id: 'mo6', moNumber: 'MO-2026-006', name: 'Aluminium Enclosure X1', progress: '100% (1,500 pcs)', priority: 'MEDIUM' },
      { id: 'mo7', moNumber: 'MO-2026-007', name: 'PCB Assembly Core-V2', progress: '100% (1,000 pcs)', priority: 'HIGH' },
    ],
    draft: [
      { id: 'mo5', moNumber: 'MO-2026-005', name: 'Sensor Module Dual-V3', progress: '0% (350 pcs draft)', priority: 'LOW' },
      { id: 'mo11', moNumber: 'MO-2026-011', name: 'Raw Aluminium Sheet Pre-cut', progress: '0% (500 pcs draft)', priority: 'LOW' },
      { id: 'mo14', moNumber: 'MO-2026-014', name: 'Custom Enclosure Prototype', progress: '0% (100 pcs draft)', priority: 'MEDIUM' },
    ],
    cancelled: [
      { id: 'mo8', moNumber: 'MO-2026-008', name: 'Lithium Battery Module 24V', progress: 'Cancelled (10% complete)', priority: 'LOW' },
      { id: 'mo15', moNumber: 'MO-2026-015', name: 'Sensor Module Dual-V1', progress: 'Discontinued model', priority: 'LOW' },
      { id: 'mo18', moNumber: 'MO-2026-018', name: 'Heavy-Duty Bracket Spec-A', progress: 'Material shortage', priority: 'LOW' },
    ],
  };

  const statusConfigs = [
    { key: 'in_progress', label: 'In Progress', count: byStatus.in_progress || 12, color: 'bg-amber-500', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', count: byStatus.confirmed || 7, color: 'bg-blue-600', icon: CheckCircle2 },
    { key: 'completed', label: 'Completed', count: byStatus.completed || 5, color: 'bg-emerald-600', icon: CheckCircle2 },
    { key: 'draft', label: 'Draft', count: byStatus.draft || 3, color: 'bg-gray-400', icon: FileText },
    { key: 'cancelled', label: 'Cancelled', count: byStatus.cancelled || 1, color: 'bg-red-500', icon: XCircle },
  ];

  return (
    <div id="dashboard-order-status-overview" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs mb-6 h-full flex flex-col justify-between relative">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Manufacturing Order Statuses</h2>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            Total: {formatNumber(totalOrders)}
          </span>
        </div>

        <div className="space-y-4 relative">
          {/* Multi-segmented Distribution Bar */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
            {statusConfigs.map((status) => {
              const percent = totalOrders > 0 ? (status.count / totalOrders) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={status.key}
                  style={{ width: `${percent}%` }}
                  onMouseEnter={() => setHoveredStatus(status.key)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`${status.color} hover:brightness-110 cursor-pointer transition-all duration-200 h-full first:rounded-l-full last:rounded-r-full relative`}
                  title={`${status.label}: ${status.count} (${Math.round(percent)}%)`}
                ></div>
              );
            })}
          </div>

          {/* Status Breakdown List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {statusConfigs.map((status) => {
              const percent = totalOrders > 0 ? Math.round((status.count / totalOrders) * 100) : 0;
              const isHovered = hoveredStatus === status.key;
              const top3 = top3Map[status.key] || [];

              return (
                <div
                  key={status.key}
                  onMouseEnter={() => setHoveredStatus(status.key)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isHovered
                      ? 'bg-slate-900 text-white border-slate-800 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                    <span className="font-semibold text-xs">{status.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold">{formatNumber(status.count)}</span>
                    <span className={isHovered ? 'text-slate-400' : 'text-gray-400'}>({percent}%)</span>
                  </div>

                  {/* Top 3 Hover List Popover */}
                  {isHovered && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 text-white rounded-xl shadow-2xl p-3 z-50 border border-slate-700 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                        <span className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">
                          Top 3 {status.label} Orders
                        </span>
                        <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">
                          Click to View
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {top3.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/manufacturing-orders`);
                            }}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-blue-300">{item.moNumber}</span>
                              <span className="text-[9px] bg-slate-700 px-1 rounded text-slate-300 font-mono">
                                {item.priority}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-200 truncate">{item.name}</div>
                            <div className="text-[10px] text-emerald-400 font-mono">{item.progress}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active MO Component Availability Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Component Readiness (Active MOs)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
            <span className="block font-bold text-emerald-800">{compAvailability.available || 18}</span>
            <span className="text-[11px] text-emerald-600">Available</span>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
            <span className="block font-bold text-amber-800">{compAvailability.partially_available || 4}</span>
            <span className="text-[11px] text-amber-600">Partial</span>
          </div>
          <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
            <span className="block font-bold text-red-800">{compAvailability.insufficient || 2}</span>
            <span className="text-[11px] text-red-600">Insufficient</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusOverview;
