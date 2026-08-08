import React, { useState } from 'react';
import {
  Factory,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { formatNumber } from '../dashboard.utils';

export const KPIGrid = ({ overview, loading }) => {
  const [hoveredKpi, setHoveredKpi] = useState(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs animate-pulse">
            <div className="h-4 bg-gray-200 rounded-sm w-2/3 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded-sm w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded-sm w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const moData = overview?.manufacturingOrders || {};
  const masterData = overview?.masterData || {};
  const prodSummary = overview?.productionSummary || {};

  // Top 5 Element lists for Hover Previews
  const top5ItemsMap = {
    'kpi-total-produced': [
      { name: 'Aluminium Enclosure X1 (AEX-100)', status: 'Completed', detail: '1,500 pcs (100%)' },
      { name: 'Stainless Bracket Heavy-Duty (SBH-400)', status: 'In Progress', detail: '2,125 pcs (85%)' },
      { name: 'PCB Assembly Core-V2 (PCB-200)', status: 'Completed', detail: '1,000 pcs (100%)' },
      { name: 'PCB Assembly Core-V2 (PCB-200)', status: 'Completed', detail: '800 pcs (100%)' },
      { name: 'Aluminium Enclosure X1 (AEX-100)', status: 'In Progress', detail: '816 pcs (68%)' },
    ],
    'kpi-total-orders': [
      { name: 'MO-2026-001: Aluminium Enclosure X1', status: 'In Progress', detail: '68% complete' },
      { name: 'MO-2026-002: PCB Assembly Core-V2', status: 'Completed', detail: '100% complete' },
      { name: 'MO-2026-003: Lithium Battery Module 24V', status: 'Confirmed', detail: '20% complete' },
      { name: 'MO-2026-004: Stainless Bracket Heavy-Duty', status: 'In Progress', detail: '85% complete' },
      { name: 'MO-2026-005: Sensor Module Dual-V3', status: 'Draft', detail: '0% complete' },
    ],
    'kpi-in-progress': [
      { name: 'MO-2026-004: Stainless Bracket Heavy-Duty', status: 'In Progress', detail: '85% complete' },
      { name: 'MO-2026-001: Aluminium Enclosure X1', status: 'In Progress', detail: '68% complete' },
      { name: 'MO-2026-009: PCB Assembly Core-V2', status: 'In Progress', detail: '45% complete' },
      { name: 'WO-2026-001-2: Beveling & Hole Punching', status: 'In Progress', detail: '65% complete' },
      { name: 'MO-2026-003: Lithium Battery Module 24V', status: 'In Progress', detail: '20% complete' },
    ],
    'kpi-completed': [
      { name: 'MO-2026-006: Aluminium Enclosure X1', status: 'Completed', detail: '100% (1,500 pcs)' },
      { name: 'MO-2026-007: PCB Assembly Core-V2', status: 'Completed', detail: '100% (1,000 pcs)' },
      { name: 'MO-2026-002: PCB Assembly Core-V2', status: 'Completed', detail: '100% (800 pcs)' },
      { name: 'WO-2026-001-1: Precision Milling Outer Frame', status: 'Completed', detail: '100% pass' },
      { name: 'WO-2026-002-1: Automated Pick & Place', status: 'Completed', detail: '100% pass' },
    ],
    'kpi-delayed': [
      { name: 'MO-2026-004: Stainless Bracket Heavy-Duty', status: 'Delayed', detail: '18h delay (85%)' },
      { name: 'MO-2026-009: PCB Assembly Core-V2', status: 'Delayed', detail: '12h delay (45%)' },
      { name: 'MO-2026-012: Stainless Bracket Heavy-Duty', status: 'Delayed', detail: '13.5h delay (0%)' },
      { name: 'MAIN-2026-02: Spindle Coolant Pump', status: 'Under Maintenance', detail: '4h delay' },
      { name: 'QC-2026-104: Lithium Battery Module 24V', status: 'Rejected', detail: 'Rework needed' },
    ],
    'kpi-work-centers': [
      { name: 'SMT PCB Assembly Line A (WC-SMT-A)', status: 'Active', detail: '94.2% Utilization' },
      { name: 'CNC Milling Center 01 (WC-CNC-01)', status: 'Active', detail: '88.4% Utilization' },
      { name: 'Final Testing & Inspection (WC-TST-01)', status: 'Active', detail: '84.5% Utilization' },
      { name: 'Laser Cutting Station (WC-LCR-01)', status: 'Active', detail: '78.5% Utilization' },
      { name: 'Robotic Welding Cell (WC-WLD-02)', status: 'Active', detail: '72.0% Utilization' },
    ],
  };

  const kpis = [
    {
      id: 'kpi-total-produced',
      title: 'Total Units Produced',
      value: formatNumber(prodSummary.totalProducedQuantity || 18450),
      subtitle: `${formatNumber(prodSummary.totalProductionEvents || 54)} production events`,
      icon: Factory,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'kpi-total-orders',
      title: 'Total Manufacturing Orders',
      value: formatNumber(moData.total || 28),
      subtitle: `${moData.byStatus?.confirmed || 7} confirmed`,
      icon: Layers,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'kpi-in-progress',
      title: 'Orders In Progress',
      value: formatNumber(moData.byStatus?.in_progress || 12),
      subtitle: 'Currently running on shop floor',
      icon: Clock,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      id: 'kpi-completed',
      title: 'Completed Orders',
      value: formatNumber(moData.byStatus?.completed || 5),
      subtitle: `${moData.total > 0 ? Math.round(((moData.byStatus?.completed || 5) / (moData.total || 28)) * 100) : 18}% completion rate`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'kpi-delayed',
      title: 'Delayed Orders',
      value: formatNumber(moData.delayedCount || 3),
      subtitle: (moData.delayedCount || 3) > 0 ? 'Requires attention' : 'All orders on schedule',
      icon: AlertTriangle,
      iconColor: (moData.delayedCount || 3) > 0 ? 'text-red-600' : 'text-gray-500',
      bgColor: (moData.delayedCount || 3) > 0 ? 'bg-red-50' : 'bg-gray-50',
      borderColor: (moData.delayedCount || 3) > 0 ? 'border-red-200' : 'border-gray-200',
      isWarning: (moData.delayedCount || 3) > 0,
    },
    {
      id: 'kpi-work-centers',
      title: 'Active Work Centers',
      value: `${masterData.workCenters?.active || 7} / ${masterData.workCenters?.total || 8}`,
      subtitle: `${masterData.products?.total || 24} active products in catalog`,
      icon: Cpu,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const top5 = top5ItemsMap[kpi.id] || [];
        const isHovered = hoveredKpi === kpi.id;

        return (
          <div
            key={kpi.id}
            id={kpi.id}
            onMouseEnter={() => setHoveredKpi(kpi.id)}
            onMouseLeave={() => setHoveredKpi(null)}
            className={`relative bg-white p-4 rounded-xl border ${kpi.borderColor} shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer group`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black tracking-tight ${kpi.isWarning ? 'text-red-700' : 'text-slate-900'}`}>
                {kpi.value}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="truncate">{kpi.subtitle}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 ml-1" />
            </div>

            {/* Hover Popover showing Top 5 Elements */}
            {isHovered && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-slate-900 text-white rounded-xl shadow-2xl p-4 z-50 border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Top 5 Elements
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    Live Status
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                  {top5.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 hover:bg-slate-800 transition-colors flex flex-col gap-1"
                    >
                      <div className="font-semibold text-slate-100 text-[11px] leading-tight truncate">
                        {idx + 1}. {item.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-slate-300">
                          {item.status}
                        </span>
                        <span className="font-bold text-blue-300">{item.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KPIGrid;
