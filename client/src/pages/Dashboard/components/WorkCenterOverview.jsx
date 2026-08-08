import React from 'react';
import { Cpu, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { formatNumber, formatDuration, getStatusBadgeClass, formatStatus } from '../dashboard.utils';

export const WorkCenterOverview = ({ utilization, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded-sm w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-100 rounded-lg w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-xs mb-6">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Unable to load work center utilization</h3>
        </div>
        <p className="text-xs text-gray-600">{error}</p>
      </div>
    );
  }

  const workCenters = utilization?.byWorkCenter || [];
  const metrics = utilization?.metrics || {};

  return (
    <div id="dashboard-work-center-overview" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs mb-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">Work Center Operational Overview</h2>
          </div>
          <span className="text-xs text-gray-500 font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100">
            Overall Ratio: {metrics.overallOperationalUtilizationPercentage || 0}%
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Calculated as actual executed duration vs planned duration across work orders.
        </p>

        {workCenters.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm">No work center activity recorded for this period.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {workCenters.map((wc) => {
              const utilRatio = wc.operationalUtilizationRatioPercentage || 0;
              const isOvertime = utilRatio > 110;

              return (
                <div
                  key={wc.workCenterId}
                  className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 transition-colors duration-150 text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{wc.workCenterName}</span>
                      <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                        {wc.workCenterCode}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getStatusBadgeClass(wc.status)}`}>
                      {formatStatus(wc.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 block">Work Orders</span>
                      <span className="font-semibold text-gray-800">
                        {wc.inProgressWorkOrders} active / {wc.completedWorkOrders} done
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Planned Hrs</span>
                      <span className="font-semibold text-gray-800">{wc.plannedHours}h</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Actual Hrs</span>
                      <span className="font-semibold text-gray-800">{wc.actualHours}h</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Op Utilization</span>
                      <span className={`font-bold ${isOvertime ? 'text-amber-700' : 'text-purple-700'}`}>
                        {utilRatio}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar representing operational duration ratio */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      style={{ width: `${Math.min(utilRatio, 100)}%` }}
                      className={`h-full ${isOvertime ? 'bg-amber-500' : 'bg-purple-600'} transition-all duration-300`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
        <span>Total Work Orders Executed: {metrics.totalWorkOrders || 0}</span>
        <span>Planned: {metrics.totalPlannedDurationHours || 0}h | Actual: {metrics.totalActualDurationHours || 0}h</span>
      </div>
    </div>
  );
};

export default WorkCenterOverview;
