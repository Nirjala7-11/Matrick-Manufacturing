import React, { useState } from 'react';
import axios from '../../../api/axios';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const ExportButtons = ({
  selectedReport,
  filters,
  previewColumns = [],
  previewRows = [],
  disabled = false,
}) => {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [exportErrorMsg, setExportErrorMsg] = useState('');

  if (!selectedReport) return null;

  const formats = selectedReport.formats || ['excel', 'pdf'];

  const getQueryParams = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.productId) params.productId = filters.productId;
    if (filters.workCenterId) params.workCenterId = filters.workCenterId;
    if (filters.manufacturingOrderId)
      params.manufacturingOrderId = filters.manufacturingOrderId;
    if (filters.status) params.status = filters.status;
    if (filters.movementType) params.movementType = filters.movementType;
    return params;
  };

  const handleExport = async (format) => {
    setExportSuccessMsg('');
    setExportErrorMsg('');

    if (format === 'excel') setDownloadingExcel(true);
    if (format === 'pdf') setDownloadingPdf(true);

    try {
      const endpoint = `/reports/${selectedReport.id}/${format}`;
      const params = getQueryParams();

      const response = await axios.get(endpoint, {
        params,
        responseType: 'blob',
      });

      const mimeType =
        format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf';

      const blob = new Blob([response.data], { type: mimeType });
      const filename = `${selectedReport.id}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setExportSuccessMsg(
        `Successfully downloaded ${selectedReport.title} (${format.toUpperCase()})`
      );
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.warn(`Backend export failed for ${format}, using client-side generator:`, err);
      
      // Fallback to client-side generator using active dataset
      try {
        const cleanFileName = `${selectedReport.id}_report`;
        if (format === 'excel') {
          exportToExcel(previewColumns, previewRows, cleanFileName, selectedReport.title);
        } else {
          exportToPDF(previewColumns, previewRows, cleanFileName, selectedReport.title);
        }
        setExportSuccessMsg(
          `Successfully exported ${selectedReport.title} (${format.toUpperCase()})`
        );
        setTimeout(() => setExportSuccessMsg(''), 4000);
      } catch (fallbackErr) {
        console.error('Client-side export error:', fallbackErr);
        setExportErrorMsg(`Failed to generate ${format.toUpperCase()} report.`);
        setTimeout(() => setExportErrorMsg(''), 5000);
      }
    } finally {
      if (format === 'excel') setDownloadingExcel(false);
      if (format === 'pdf') setDownloadingPdf(false);
    }
  };

  const isExporting = downloadingExcel || downloadingPdf;

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Export Report Document
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Download formatted report files (.xlsx / .pdf) matching active filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {formats.includes('excel') && (
            <button
              type="button"
              disabled={disabled || isExporting}
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet
                className={`w-4 h-4 ${downloadingExcel ? 'mms-spinner-animate' : ''}`}
              />
              <span>
                {downloadingExcel ? 'Generating Excel...' : 'Export Excel (.xlsx)'}
              </span>
            </button>
          )}

          {formats.includes('pdf') && (
            <button
              type="button"
              disabled={disabled || isExporting}
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <FileText
                className={`w-4 h-4 ${downloadingPdf ? 'mms-spinner-animate' : ''}`}
              />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Export PDF (.pdf)'}</span>
            </button>
          )}
        </div>
      </div>

      {exportSuccessMsg && (
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{exportSuccessMsg}</span>
        </div>
      )}

      {exportErrorMsg && (
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{exportErrorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;
