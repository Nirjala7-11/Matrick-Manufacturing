import { asyncHandler } from '../utils/asyncHandler.js';
import reportService from '../services/report.service.js';

/**
 * Helper: Format current timestamp for filenames
 */
const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

/**
 * Helper: Send Excel file response
 */
const sendExcelResponse = async (res, title, columns, dataRows) => {
  const buffer = await reportService.exportToExcel(title, columns, dataRows);
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${getTimestamp()}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
};

/**
 * Helper: Send PDF file response
 */
const sendPDFResponse = async (res, title, columns, dataRows, query = {}) => {
  const filterSummary = Object.entries(query)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  const buffer = await reportService.exportToPDF(title, columns, dataRows, filterSummary);
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${getTimestamp()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
};

/**
 * 1. Manufacturing Orders Reports
 */
export const exportManufacturingOrdersExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getManufacturingOrdersReport(req.query);
  return sendExcelResponse(res, report.title, report.columns, report.dataRows);
});

export const exportManufacturingOrdersPDF = asyncHandler(async (req, res) => {
  const report = await reportService.getManufacturingOrdersReport(req.query);
  return sendPDFResponse(res, report.title, report.columns, report.dataRows, req.query);
});

/**
 * 2. Production Throughput Reports
 */
export const exportThroughputExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getThroughputReport(req.query);
  return sendExcelResponse(res, report.title, report.columns, report.dataRows);
});

export const exportThroughputPDF = asyncHandler(async (req, res) => {
  const report = await reportService.getThroughputReport(req.query);
  return sendPDFResponse(res, report.title, report.columns, report.dataRows, req.query);
});

/**
 * 3. Work Order Reports
 */
export const exportWorkOrdersExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getWorkOrderReport(req.query);
  return sendExcelResponse(res, report.title, report.columns, report.dataRows);
});

export const exportWorkOrdersPDF = asyncHandler(async (req, res) => {
  const report = await reportService.getWorkOrderReport(req.query);
  return sendPDFResponse(res, report.title, report.columns, report.dataRows, req.query);
});

/**
 * 4. Stock Ledger Reports
 */
export const exportStockLedgerExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getStockLedgerReport(req.query);
  return sendExcelResponse(res, report.title, report.columns, report.dataRows);
});

export const exportStockLedgerPDF = asyncHandler(async (req, res) => {
  const report = await reportService.getStockLedgerReport(req.query);
  return sendPDFResponse(res, report.title, report.columns, report.dataRows, req.query);
});

/**
 * 5. Product Stock Inventory Reports
 */
export const exportProductStockExcel = asyncHandler(async (req, res) => {
  const report = await reportService.getProductStockReport(req.query);
  return sendExcelResponse(res, report.title, report.columns, report.dataRows);
});

export const exportProductStockPDF = asyncHandler(async (req, res) => {
  const report = await reportService.getProductStockReport(req.query);
  return sendPDFResponse(res, report.title, report.columns, report.dataRows, req.query);
});

export const reportController = {
  exportManufacturingOrdersExcel,
  exportManufacturingOrdersPDF,
  exportThroughputExcel,
  exportThroughputPDF,
  exportWorkOrdersExcel,
  exportWorkOrdersPDF,
  exportStockLedgerExcel,
  exportStockLedgerPDF,
  exportProductStockExcel,
  exportProductStockPDF,
};

export default reportController;
