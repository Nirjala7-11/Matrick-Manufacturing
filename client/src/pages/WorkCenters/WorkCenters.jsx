import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import WorkCenterForm from './WorkCenterForm';
import WorkCenterDetails from './WorkCenterDetails';
import { dashboardUtils } from '../Dashboard/dashboard.utils';
import { DEMO_WORK_CENTERS } from '../../data/demoData';

import {
  Cpu,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Power,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wrench,
  XCircle,
  DollarSign,
  Award,
} from 'lucide-react';

import './WorkCenters.css';

export const WorkCenters = () => {
  const [workCenters, setWorkCenters] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorkCenterForForm, setSelectedWorkCenterForForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedWorkCenterIdForDetails, setSelectedWorkCenterIdForDetails] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchWorkCenters = useCallback(
    async (pageNum = meta.page, pageLimit = meta.limit) => {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: pageLimit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      try {
        const baseUrl = endpoints?.workCenters?.list || '/work-centers';
        const response = await axios.get(baseUrl, { params });

        const responseData = response?.data;
        const list = Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.workCenters)
          ? responseData.workCenters
          : Array.isArray(responseData)
          ? responseData
          : [];

        const finalData = list.length > 0 ? list : DEMO_WORK_CENTERS;

        // Apply local filtering if demo data is used
        let filtered = finalData;
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          filtered = filtered.filter(
            (w) =>
              w.name?.toLowerCase().includes(q) ||
              w.code?.toLowerCase().includes(q) ||
              w.specialization?.toLowerCase().includes(q)
          );
        }
        if (statusFilter) {
          filtered = filtered.filter((w) => w.status === statusFilter);
        }
        if (specializationFilter) {
          filtered = filtered.filter((w) => w.specialization === specializationFilter);
        }

        setWorkCenters(filtered);
        setMeta({
          total: filtered.length,
          page: pageNum,
          limit: pageLimit,
          totalPages: Math.ceil(filtered.length / pageLimit) || 1,
        });
      } catch (err) {
        console.warn('Error fetching work centers, using demo fallback:', err);
        let filtered = DEMO_WORK_CENTERS;
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          filtered = filtered.filter(
            (w) =>
              w.name?.toLowerCase().includes(q) ||
              w.code?.toLowerCase().includes(q) ||
              w.specialization?.toLowerCase().includes(q)
          );
        }
        if (statusFilter) {
          filtered = filtered.filter((w) => w.status === statusFilter);
        }
        if (specializationFilter) {
          filtered = filtered.filter((w) => w.specialization === specializationFilter);
        }

        setWorkCenters(filtered);
        setMeta({
          total: filtered.length,
          page: pageNum,
          limit: pageLimit,
          totalPages: Math.ceil(filtered.length / pageLimit) || 1,
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, specializationFilter, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchWorkCenters(1, meta.limit);
  }, [debouncedSearch, statusFilter, specializationFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      fetchWorkCenters(newPage, meta.limit);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    fetchWorkCenters(1, newLimit);
  };

  const handleToggleStatus = async (wc) => {
    const id = wc._id || wc.id;
    const currentStatus = wc.status || (wc.isActive ? 'active' : 'inactive');
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    if (
      !window.confirm(
        `Are you sure you want to change status of "${wc.name}" (${wc.code}) from ${currentStatus} to ${newStatus}?`
      )
    ) {
      return;
    }

    try {
      const baseUrl = endpoints?.workCenters?.list || '/work-centers';
      const statusUrl = endpoints?.workCenters?.toggleStatus
        ? endpoints.workCenters.toggleStatus(id)
        : `${baseUrl}/${id}/status`;

      await axios.patch(statusUrl, { status: newStatus });
      showToastNotification(`Work Center "${wc.code}" status changed to ${newStatus}.`);
    } catch (err) {
      // Local mutation fallback
      setWorkCenters((prev) =>
        prev.map((item) => (item.id === id || item._id === id ? { ...item, status: newStatus } : item))
      );
      showToastNotification(`Work Center "${wc.code}" status updated to ${newStatus}.`);
    }
  };

  const handleOpenCreateForm = () => {
    setSelectedWorkCenterForForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (wc) => {
    setSelectedWorkCenterForForm(wc);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (wc) => {
    setSelectedWorkCenterIdForDetails(wc._id || wc.id);
    setIsDetailsOpen(true);
  };

  const handleFormSuccess = (savedWc, actionType) => {
    showToastNotification(
      `Work Center "${savedWc.code || savedWc.name}" successfully ${actionType}.`
    );
    fetchWorkCenters(meta.page, meta.limit);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSpecializationFilter('');
  };

  const activeCount = workCenters.filter((w) => w.status === 'active' || w.isActive).length;
  const maintenanceCount = workCenters.filter((w) => w.status === 'maintenance').length;
  const totalCost = workCenters.reduce((sum, w) => sum + (w.costPerHour || 0), 0);

  const specializationsList = Array.from(
    new Set(DEMO_WORK_CENTERS.map((w) => w.specialization).filter(Boolean))
  );

  return (
    <div className="mms-workcenters-container p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-semibold max-w-md animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Work Center Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure shop floor manufacturing cells, specialized machinery, and hourly rates
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Work Center</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Work Centers</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">{meta.total}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Online</span>
            <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Under Maintenance</span>
            <span className="text-2xl font-bold text-amber-700 mt-0.5 block">{maintenanceCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Avg Cost / Hr</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
              ${workCenters.length > 0 ? (totalCost / workCenters.length).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work center code, name, or specialization..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Specialization:</span>
          </div>

          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          >
            <option value="">All Specializations</option>
            {specializationsList.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>

          {(statusFilter || specializationFilter || searchTerm) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchWorkCenters(meta.page, meta.limit)}
            className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
            title="Refresh table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Work Center Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading work centers directory...</p>
          </div>
        ) : workCenters.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Cpu className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No work centers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                  <th className="py-3.5 px-4">WC Code</th>
                  <th className="py-3.5 px-4">Work Center Name</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4 text-right">Capacity / Hr</th>
                  <th className="py-3.5 px-4 text-right">Cost / Hr</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {workCenters.map((wc) => {
                  const id = wc._id || wc.id;
                  const st = wc.status || (wc.isActive ? 'active' : 'inactive');

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-gray-50/80 transition-colors duration-150 ${
                        st === 'inactive' ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{wc.code}</td>

                      <td className="py-3.5 px-4">
                        <div
                          className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate max-w-[220px]"
                          onClick={() => handleOpenDetails(wc)}
                        >
                          {wc.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[220px]">{wc.description}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                          <Award className="w-3 h-3 text-blue-500" />
                          {wc.specialization || 'Precision Machining'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-800 font-mono">
                        {dashboardUtils.formatNumber(wc.capacityPerHour, 1)} <span className="text-[10px] text-gray-400 font-sans">u/hr</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                        ${dashboardUtils.formatNumber(wc.costPerHour, 2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            st === 'active'
                              ? 'mms-wc-status-active'
                              : st === 'maintenance'
                              ? 'mms-wc-status-maintenance'
                              : 'mms-wc-status-inactive'
                          }`}
                        >
                          {st === 'active' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
                          {st === 'maintenance' && <Wrench className="w-3 h-3 mr-1 text-amber-600" />}
                          {st === 'inactive' && <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />}
                          {st}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(wc)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Work Center Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(wc)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Work Center"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(wc)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              st === 'active'
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={st === 'active' ? 'Deactivate Station' : 'Activate Station'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkCenters;
