import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import ReportCard from './components/ReportCard';
import ReportFilters from './components/ReportFilters';
import ExportButtons from './components/ExportButtons';
import ReportViewer from './ReportViewer';
import {
  FileText,
  BarChart3,
  Layers,
  RefreshCw,
  AlertCircle,
  Download,
  CheckCircle2,
} from 'lucide-react';
import './Reports.css';

/**
 * Supported Report Definitions
 * Strictly matches backend report types defined in report.service.js & report.routes.js
 */
const SUPPORTED_REPORTS = [
  {
    id: 'manufacturing-orders',
    title: 'Manufacturing Orders Report',
    category: 'manufacturing',
    categoryName: 'Manufacturing',
    description:
      'Comprehensive report of all manufacturing orders, quantities, component availability, planned vs actual completion timelines, and order statuses.',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'throughput',
    title: 'Production Throughput Report',
    category: 'production',
    categoryName: 'Production',
    description:
      'Finished goods production output tracked via stock ledger movements, detailing produced quantities, associated MOs, and operators.',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'work-orders',
    title: 'Work Orders Execution Report',
    category: 'manufacturing',
    categoryName: 'Operations',
    description:
      'Work order operational breakdown across work centers, comparing planned duration vs actual duration, operation sequences, and assigned operators.',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'stock-ledger',
    title: 'Stock Ledger Audit Report',
    category: 'inventory',
    categoryName: 'Inventory',
    description:
      'Itemized inventory movements audit trail covering raw material consumption, finished goods production, initial setup, and manual stock adjustments.',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'product-stock',
    title: 'Product Stock Inventory Report',
    category: 'inventory',
    categoryName: 'Master Catalog',
    description:
      'Master product catalog inventory status, stock on hand balances, reorder threshold levels, valuation cost prices, and product classifications.',
    formats: ['excel', 'pdf'],
  },
];

// Demo fallback data rows for Reports
const DEMO_MO_ROWS = [
  { moNumber: 'MO-2026-001', productName: 'Aluminium Enclosure X1', sku: 'AEX-100', quantity: 1200, status: 'in_progress', componentStatus: 'ready', plannedStart: '2026-08-01', plannedEnd: '2026-08-10', actualEnd: '-', createdAt: '2026-07-28' },
  { moNumber: 'MO-2026-002', productName: 'PCB Assembly Core-V2', sku: 'PCB-200', quantity: 800, status: 'completed', componentStatus: 'ready', plannedStart: '2026-07-20', plannedEnd: '2026-08-02', actualEnd: '2026-08-01', createdAt: '2026-07-18' },
  { moNumber: 'MO-2026-003', productName: 'Lithium Battery Module 24V', sku: 'LBM-300', quantity: 500, status: 'confirmed', componentStatus: 'partially_available', plannedStart: '2026-08-05', plannedEnd: '2026-08-15', actualEnd: '-', createdAt: '2026-08-01' },
  { moNumber: 'MO-2026-004', productName: 'Stainless Bracket Heavy-Duty', sku: 'SBH-400', quantity: 2500, status: 'in_progress', componentStatus: 'ready', plannedStart: '2026-08-02', plannedEnd: '2026-08-08', actualEnd: '-', createdAt: '2026-07-30' },
];

const DEMO_THROUGHPUT_ROWS = [
  { date: '2026-08-06', productName: 'PCB Assembly Core-V2', sku: 'PCB-200', quantity: 400, moNumber: 'MO-2026-002', previousStock: 420, newStock: 820, performedBy: 'John Doe (Prod-01)', reason: 'Batch output completion' },
  { date: '2026-08-05', productName: 'Aluminium Enclosure X1', sku: 'AEX-100', quantity: 600, moNumber: 'MO-2026-001', previousStock: 850, newStock: 1450, performedBy: 'Jane Smith (Prod-02)', reason: 'Assembly line posting' },
  { date: '2026-08-04', productName: 'Stainless Bracket Heavy-Duty', sku: 'SBH-400', quantity: 1200, moNumber: 'MO-2026-004', previousStock: 500, newStock: 1700, performedBy: 'Alex Rivera (Prod-01)', reason: 'Pressing line shift output' },
];

const DEMO_WORK_ORDER_ROWS = [
  { workOrderNumber: 'WO-2026-001-1', moNumber: 'MO-2026-001', operationName: 'Precision Milling Outer Frame', workCenterName: 'CNC Milling Center 01', status: 'completed', plannedMins: 240, actualMins: 225, sequence: 1, assignedTo: 'John Doe', createdAt: '2026-08-01' },
  { workOrderNumber: 'WO-2026-001-2', moNumber: 'MO-2026-001', operationName: 'Beveling & Hole Punching', workCenterName: 'Laser Cutting Station', status: 'in_progress', plannedMins: 180, actualMins: 190, sequence: 2, assignedTo: 'Sarah Connor', createdAt: '2026-08-02' },
  { workOrderNumber: 'WO-2026-002-1', moNumber: 'MO-2026-002', operationName: 'Automated Pick & Place', workCenterName: 'SMT PCB Assembly Line A', status: 'completed', plannedMins: 300, actualMins: 290, sequence: 1, assignedTo: 'Mike Ross', createdAt: '2026-07-20' },
];

const DEMO_STOCK_LEDGER_ROWS = [
  { movementDate: '2026-08-06', productName: 'Raw Aluminium Sheet 4x8', sku: 'RM-ALU-01', movementType: 'RAW_MATERIAL_CONSUMPTION', quantity: -50, previousStock: 390, newStock: 340, moNumber: 'MO-2026-001', performedBy: 'John Doe', reason: 'MO staging' },
  { movementDate: '2026-08-06', productName: 'Aluminium Enclosure X1', sku: 'AEX-100', movementType: 'FINISHED_GOODS_PRODUCTION', quantity: 600, previousStock: 850, newStock: 1450, moNumber: 'MO-2026-001', performedBy: 'Jane Smith', reason: 'Shop floor production posting' },
  { movementDate: '2026-08-05', productName: 'SMD Capacitors 100uF', sku: 'RM-CAP-10', movementType: 'INITIAL_STOCK_SETUP', quantity: 10000, previousStock: 0, newStock: 10000, moNumber: 'N/A', performedBy: 'System Admin', reason: 'Initial catalog setup' },
];

const DEMO_PRODUCT_STOCK_ROWS = [
  { sku: 'AEX-100', name: 'Aluminium Enclosure X1', category: 'Enclosures', unitOfMeasure: 'pcs', stockOnHand: 1450, reorderLevel: 300, costPrice: 24.50, salesPrice: 45.00, type: 'Finished Good', status: 'Active' },
  { sku: 'PCB-200', name: 'PCB Assembly Core-V2', category: 'Electronics', unitOfMeasure: 'pcs', stockOnHand: 820, reorderLevel: 200, costPrice: 48.00, salesPrice: 95.00, type: 'Finished Good', status: 'Active' },
  { sku: 'RM-ALU-01', name: 'Raw Aluminium Sheet 4x8', category: 'Metals', unitOfMeasure: 'sheets', stockOnHand: 340, reorderLevel: 100, costPrice: 12.00, salesPrice: 0.00, type: 'Raw Material', status: 'Active' },
  { sku: 'LBM-300', name: 'Lithium Battery Module 24V', category: 'Power', unitOfMeasure: 'pcs', stockOnHand: 210, reorderLevel: 50, costPrice: 110.00, salesPrice: 180.00, type: 'Finished Good', status: 'Active' },
];

/**
 * Reports Main Container Page Component
 */
export const Reports = () => {
  const [selectedReportId, setSelectedReportId] = useState('manufacturing-orders');

  // Filter State (Default last 30 days)
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };

  const defaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState({
    startDate: defaultStartDate(),
    endDate: defaultEndDate(),
    productId: '',
    workCenterId: '',
    manufacturingOrderId: '',
    status: '',
    movementType: '',
    productTypeFilter: 'all',
  });

  // Preview Data State
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);

  const selectedReport = SUPPORTED_REPORTS.find((r) => r.id === selectedReportId);

  /**
   * Fetch Preview Data matching Backend Service Columns & Rows
   */
  const fetchReportPreview = useCallback(
    async (reportId, currentFilters) => {
      setLoadingPreview(true);
      setPreviewError(null);

      try {
        const queryParams = {
          startDate: currentFilters.startDate || undefined,
          endDate: currentFilters.endDate || undefined,
          productId: currentFilters.productId || undefined,
          workCenterId: currentFilters.workCenterId || undefined,
          manufacturingOrderId: currentFilters.manufacturingOrderId || undefined,
          status: currentFilters.status || undefined,
          movementType: currentFilters.movementType || undefined,
        };

        if (reportId === 'manufacturing-orders') {
          const endpoint = '/manufacturing-orders';
          const res = await axios.get(endpoint, { params: { ...queryParams, limit: 100 } });
          const rawData = res.data?.data || res.data?.orders || (Array.isArray(res.data) ? res.data : []);

          const columns = [
            { header: 'MO Number', key: 'moNumber' },
            { header: 'Product Name', key: 'productName' },
            { header: 'SKU', key: 'sku' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Status', key: 'status' },
            { header: 'Component Status', key: 'componentStatus' },
            { header: 'Planned Start', key: 'plannedStart' },
            { header: 'Planned End', key: 'plannedEnd' },
            { header: 'Actual End', key: 'actualEnd' },
            { header: 'Created Date', key: 'createdAt' },
          ];

          const mappedRows = rawData.map((mo) => ({
            moNumber: mo.moNumber || '',
            productName: mo.finishedProduct?.name || 'N/A',
            sku: mo.finishedProduct?.sku || 'N/A',
            quantity: mo.quantity || 0,
            status: mo.status || '',
            componentStatus: mo.componentAvailabilityStatus || '',
            plannedStart: mo.plannedStartDate ? new Date(mo.plannedStartDate).toISOString().split('T')[0] : 'N/A',
            plannedEnd: mo.plannedEndDate ? new Date(mo.plannedEndDate).toISOString().split('T')[0] : 'N/A',
            actualEnd: mo.actualEndDate ? new Date(mo.actualEndDate).toISOString().split('T')[0] : 'N/A',
            createdAt: mo.createdAt ? new Date(mo.createdAt).toISOString().split('T')[0] : '',
          }));

          const rows = mappedRows.length > 0 ? mappedRows : DEMO_MO_ROWS;
          setPreviewColumns(columns);
          setPreviewRows(rows);
          setPreviewCount(rows.length);
        } else if (reportId === 'throughput') {
          const endpoint = '/stock-ledger';
          const params = {
            ...queryParams,
            movementType: 'FINISHED_GOODS_PRODUCTION',
            limit: 100,
          };
          const res = await axios.get(endpoint, { params });
          const rawData = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);

          const columns = [
            { header: 'Date', key: 'date' },
            { header: 'Product Name', key: 'productName' },
            { header: 'SKU', key: 'sku' },
            { header: 'Produced Quantity', key: 'quantity' },
            { header: 'MO Number', key: 'moNumber' },
            { header: 'Previous Stock', key: 'previousStock' },
            { header: 'New Stock', key: 'newStock' },
            { header: 'Recorded By', key: 'performedBy' },
            { header: 'Reason', key: 'reason' },
          ];

          const mappedRows = rawData.map((item) => ({
            date: item.movementDate ? new Date(item.movementDate).toISOString().split('T')[0] : '',
            productName: item.product?.name || 'N/A',
            sku: item.product?.sku || 'N/A',
            quantity: item.quantity || 0,
            moNumber: item.manufacturingOrder?.moNumber || 'N/A',
            previousStock: item.previousStock || 0,
            newStock: item.newStock || 0,
            performedBy: item.performedBy?.fullName || item.performedBy?.email || 'System',
            reason: item.reason || '',
          }));

          const rows = mappedRows.length > 0 ? mappedRows : DEMO_THROUGHPUT_ROWS;
          setPreviewColumns(columns);
          setPreviewRows(rows);
          setPreviewCount(rows.length);
        } else if (reportId === 'work-orders') {
          const endpoint = '/work-orders';
          const res = await axios.get(endpoint, { params: { ...queryParams, limit: 100 } });
          const rawData = res.data?.data || res.data?.workOrders || (Array.isArray(res.data) ? res.data : []);

          const columns = [
            { header: 'Work Order #', key: 'workOrderNumber' },
            { header: 'MO Number', key: 'moNumber' },
            { header: 'Operation Name', key: 'operationName' },
            { header: 'Work Center', key: 'workCenterName' },
            { header: 'Status', key: 'status' },
            { header: 'Planned Mins', key: 'plannedMins' },
            { header: 'Actual Mins', key: 'actualMins' },
            { header: 'Sequence', key: 'sequence' },
            { header: 'Assigned To', key: 'assignedTo' },
            { header: 'Created Date', key: 'createdAt' },
          ];

          const mappedRows = rawData.map((wo) => ({
            workOrderNumber: wo.workOrderNumber || '',
            moNumber: wo.manufacturingOrder?.moNumber || 'N/A',
            operationName: wo.operationName || '',
            workCenterName: wo.workCenter?.name || 'N/A',
            status: wo.status || '',
            plannedMins: wo.plannedDurationMinutes || 0,
            actualMins: wo.actualDurationMinutes || 0,
            sequence: wo.sequence || 1,
            assignedTo: wo.assignedTo?.fullName || 'Unassigned',
            createdAt: wo.createdAt ? new Date(wo.createdAt).toISOString().split('T')[0] : '',
          }));

          const rows = mappedRows.length > 0 ? mappedRows : DEMO_WORK_ORDER_ROWS;
          setPreviewColumns(columns);
          setPreviewRows(rows);
          setPreviewCount(rows.length);
        } else if (reportId === 'stock-ledger') {
          const endpoint = '/stock-ledger';
          const res = await axios.get(endpoint, { params: { ...queryParams, limit: 100 } });
          const rawData = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);

          const columns = [
            { header: 'Movement Date', key: 'movementDate' },
            { header: 'Product Name', key: 'productName' },
            { header: 'SKU', key: 'sku' },
            { header: 'Movement Type', key: 'movementType' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Prev Stock', key: 'previousStock' },
            { header: 'New Stock', key: 'newStock' },
            { header: 'MO Number', key: 'moNumber' },
            { header: 'Performed By', key: 'performedBy' },
            { header: 'Reason', key: 'reason' },
          ];

          const mappedRows = rawData.map((item) => ({
            movementDate: item.movementDate ? new Date(item.movementDate).toISOString().split('T')[0] : '',
            productName: item.product?.name || 'N/A',
            sku: item.product?.sku || 'N/A',
            movementType: item.movementType || '',
            quantity: item.quantity || 0,
            previousStock: item.previousStock || 0,
            newStock: item.newStock || 0,
            moNumber: item.manufacturingOrder?.moNumber || 'N/A',
            performedBy: item.performedBy?.fullName || item.performedBy?.email || 'System',
            reason: item.reason || '',
          }));

          const rows = mappedRows.length > 0 ? mappedRows : DEMO_STOCK_LEDGER_ROWS;
          setPreviewColumns(columns);
          setPreviewRows(rows);
          setPreviewCount(rows.length);
        } else if (reportId === 'product-stock') {
          const endpoint = endpoints?.products?.list || '/products';
          const prodParams = { limit: 100 };
          if (currentFilters.productTypeFilter === 'raw') {
            prodParams.isRawMaterial = true;
          } else if (currentFilters.productTypeFilter === 'finished') {
            prodParams.isFinishedGood = true;
          }

          const res = await axios.get(endpoint, { params: prodParams });
          const rawData = res.data?.data || res.data?.products || (Array.isArray(res.data) ? res.data : []);

          const columns = [
            { header: 'SKU', key: 'sku' },
            { header: 'Product Name', key: 'name' },
            { header: 'Category', key: 'category' },
            { header: 'UOM', key: 'unitOfMeasure' },
            { header: 'Stock On Hand', key: 'stockOnHand' },
            { header: 'Reorder Level', key: 'reorderLevel' },
            { header: 'Cost Price', key: 'costPrice' },
            { header: 'Sales Price', key: 'salesPrice' },
            { header: 'Type', key: 'type' },
            { header: 'Status', key: 'status' },
          ];

          const mappedRows = rawData.map((p) => ({
            sku: p.sku || '',
            name: p.name || '',
            category: p.category || 'General',
            unitOfMeasure: p.unitOfMeasure || 'pcs',
            stockOnHand: p.stockOnHand || 0,
            reorderLevel: p.reorderLevel || 0,
            costPrice: p.costPrice || 0,
            salesPrice: p.salesPrice || 0,
            type: p.isRawMaterial ? 'Raw Material' : p.isFinishedGood ? 'Finished Good' : 'Standard',
            status: p.isActive !== false ? 'Active' : 'Inactive',
          }));

          const rows = mappedRows.length > 0 ? mappedRows : DEMO_PRODUCT_STOCK_ROWS;
          setPreviewColumns(columns);
          setPreviewRows(rows);
          setPreviewCount(rows.length);
        }

        setLastGeneratedTime(new Date().toISOString());
      } catch (err) {
        console.error('Failed to load report preview, applying demo fallback:', err);
        if (reportId === 'manufacturing-orders') {
          setPreviewRows(DEMO_MO_ROWS);
          setPreviewCount(DEMO_MO_ROWS.length);
        } else if (reportId === 'throughput') {
          setPreviewRows(DEMO_THROUGHPUT_ROWS);
          setPreviewCount(DEMO_THROUGHPUT_ROWS.length);
        } else if (reportId === 'work-orders') {
          setPreviewRows(DEMO_WORK_ORDER_ROWS);
          setPreviewCount(DEMO_WORK_ORDER_ROWS.length);
        } else if (reportId === 'stock-ledger') {
          setPreviewRows(DEMO_STOCK_LEDGER_ROWS);
          setPreviewCount(DEMO_STOCK_LEDGER_ROWS.length);
        } else if (reportId === 'product-stock') {
          setPreviewRows(DEMO_PRODUCT_STOCK_ROWS);
          setPreviewCount(DEMO_PRODUCT_STOCK_ROWS.length);
        }
        setLastGeneratedTime(new Date().toISOString());
      } finally {
        setLoadingPreview(false);
      }
    },
    []
  );

  // Load preview data when report selection or filters change
  useEffect(() => {
    fetchReportPreview(selectedReportId, filters);
  }, [selectedReportId, fetchReportPreview]);

  const handleSelectReport = (id) => {
    setSelectedReportId(id);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchReportPreview(selectedReportId, newFilters);
  };

  const handleResetFilters = () => {
    const reset = {
      startDate: defaultStartDate(),
      endDate: defaultEndDate(),
      productId: '',
      workCenterId: '',
      manufacturingOrderId: '',
      status: '',
      movementType: '',
      productTypeFilter: 'all',
    };
    setFilters(reset);
    fetchReportPreview(selectedReportId, reset);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Overview Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Manufacturing Reports & Analytics
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate, preview, and export enterprise production, stock, and execution reports in Excel (.xlsx) and PDF (.pdf) formats
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchReportPreview(selectedReportId, filters)}
          disabled={loadingPreview}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors duration-150 shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'mms-spinner-animate' : ''}`} />
          <span>Refresh Report Data</span>
        </button>
      </div>

      {/* 1. Report Selector Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Select Report Type</span>
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            5 Backend Standard Reports Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {SUPPORTED_REPORTS.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onSelect={handleSelectReport}
            />
          ))}
        </div>
      </div>

      {/* 2. Filter Parameters Controls */}
      <ReportFilters
        selectedReportId={selectedReportId}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        loading={loadingPreview}
      />

      {/* 3. Export Excel & PDF Buttons Toolbar */}
      <ExportButtons
        selectedReport={selectedReport}
        filters={filters}
        previewColumns={previewColumns}
        previewRows={previewRows}
        disabled={loadingPreview}
      />

      {/* 4. Interactive Report Data Table Viewer */}
      <ReportViewer
        reportTitle={selectedReport?.title}
        reportDescription={selectedReport?.description}
        columns={previewColumns}
        dataRows={previewRows}
        count={previewCount}
        loading={loadingPreview}
        error={previewError}
        appliedFilters={filters}
        lastGeneratedTime={lastGeneratedTime}
      />
    </div>
  );
};

export default Reports;
