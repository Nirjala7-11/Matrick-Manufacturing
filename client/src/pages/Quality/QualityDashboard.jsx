import React, { useState, useEffect } from 'react';
import { QualityMetrics } from './components/QualityMetrics';
import { InspectionTable } from './components/InspectionTable';
import { DefectAnalysis } from './components/DefectAnalysis';
import { Shield, Info } from 'lucide-react';
import './QualityDashboard.css';

/**
 * Enterprise Quality Management Dashboard Page
 */
export const QualityDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [defectData, setDefectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch quality data if API endpoints exist on backend
    const fetchQualityData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/quality/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          setMetrics(json.data?.metrics || null);
          setInspections(json.data?.inspections || []);
          setDefectData(json.data?.defects || null);
        } else {
          // Backend quality endpoints not implemented
          setMetrics(null);
          setInspections([]);
          setDefectData(null);
        }
      } catch (err) {
        console.warn('Quality API fetch notice: Quality backend endpoints not provisioned.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, []);

  return (
    <div className="quality-dashboard p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quality checkpoints, inspection logs, pass/fail audit records.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
          <Info className="w-4 h-4 text-gray-400" />
          Backend API Source Verification Enabled
        </div>
      </div>

      {/* Metrics Section */}
      <QualityMetrics metrics={metrics} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InspectionTable inspections={inspections} />
        </div>
        <div>
          <DefectAnalysis defectData={defectData} />
        </div>
      </div>
    </div>
  );
};

export default QualityDashboard;
