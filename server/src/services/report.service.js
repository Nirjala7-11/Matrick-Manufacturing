import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import env from '../config/env.js';
import ManufacturingOrder from '../models/ManufacturingOrder.js';
import WorkOrder from '../models/WorkOrder.js';
import StockLedger from '../models/StockLedger.js';
import Product from '../models/Product.js';

/**
 * Helper: Create standardized application error
 */
const createError = (message, statusCode = 400, code = 'BAD_REQUEST') => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

/**
 * Ensure temporary report directory exists
 */
const ensureTempDirExists = () => {
  try {
    if (!fs.existsSync(env.REPORTS_TEMP_DIR)) {
      fs.mkdirSync(env.REPORTS_TEMP_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create REPORTS_TEMP_DIR:', err);
  }
};

/**
 * Parse and validate common report filter parameters
 */
export const parseReportFilters = (query = {}) => {
  const filters = {};

  // Date range parsing
  if (query.startDate) {
    const start = new Date(query.startDate);
    if (isNaN(start.getTime())) {
      throw createError('Invalid startDate parameter. Expected YYYY-MM-DD', 400, 'INVALID_DATE');
    }
    if (!query.startDate.includes('T')) {
      start.setUTCHours(0, 0, 0, 0);
    }
    filters.startDate = start;
  }

  if (query.endDate) {
    const end = new Date(query.endDate);
    if (isNaN(end.getTime())) {
      throw createError('Invalid endDate parameter. Expected YYYY-MM-DD', 400, 'INVALID_DATE');
    }
    if (!query.endDate.includes('T')) {
      end.setUTCHours(23, 59, 59, 999);
    }
    filters.endDate = end;
  }

  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw createError('startDate cannot be after endDate', 400, 'INVALID_DATE_RANGE');
  }

  // ObjectId validations
  if (query.productId) {
    if (!mongoose.Types.ObjectId.isValid(query.productId)) {
      throw createError('Invalid productId filter', 400, 'INVALID_OBJECT_ID');
    }
    filters.productId = query.productId;
  }

  if (query.manufacturingOrderId) {
    if (!mongoose.Types.ObjectId.isValid(query.manufacturingOrderId)) {
      throw createError('Invalid manufacturingOrderId filter', 400, 'INVALID_OBJECT_ID');
    }
    filters.manufacturingOrderId = query.manufacturingOrderId;
  }

  if (query.workCenterId) {
    if (!mongoose.Types.ObjectId.isValid(query.workCenterId)) {
      throw createError('Invalid workCenterId filter', 400, 'INVALID_OBJECT_ID');
    }
    filters.workCenterId = query.workCenterId;
  }

  if (query.status) {
    filters.status = String(query.status).trim();
  }

  if (query.movementType) {
    filters.movementType = String(query.movementType).trim();
  }

  return filters;
};

/**
 * Check and enforce EXPORT_MAX_ROWS threshold
 */
const validateMaxRows = (count) => {
  const maxRows = env.EXPORT_MAX_ROWS || 10000;
  if (count > maxRows) {
    throw createError(
      `Export row count (${count}) exceeds the maximum limit of ${maxRows} rows. Please refine your date range or search filters.`,
      400,
      'EXPORT_MAX_ROWS_EXCEEDED'
    );
  }
};

/**
 * Generic Excel Generator using ExcelJS
 */
export const exportToExcel = async (reportTitle, columns, dataRows) => {
  ensureTempDirExists();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manufacturing Management System';
  workbook.created = new Date();

  const sheetName = reportTitle.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 30);
  const worksheet = workbook.addWorksheet(sheetName || 'Report');

  // Title Block
  worksheet.mergeCells('A1', `${String.fromCharCode(64 + Math.max(columns.length, 4))}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = reportTitle;
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 36;

  // Metadata Block
  worksheet.mergeCells('A2', `${String.fromCharCode(64 + Math.max(columns.length, 4))}2`);
  const metaCell = worksheet.getCell('A2');
  metaCell.value = `Generated: ${new Date().toISOString()} | Total Records: ${dataRows.length}`;
  metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Blank line

  // Column Headers
  const headerRowValues = columns.map((col) => col.header);
  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
    };
  });

  // Data Rows
  dataRows.forEach((row, rowIndex) => {
    const rowValues = columns.map((col) => {
      const val = row[col.key];
      return val !== undefined && val !== null ? val : '';
    });
    const addedRow = worksheet.addRow(rowValues);
    addedRow.height = 20;

    const isEven = rowIndex % 2 === 0;
    addedRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  // Auto-fit Column Widths
  columns.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1);
    let maxLen = col.header.length;
    dataRows.forEach((row) => {
      const val = row[col.key];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    column.width = Math.min(Math.max(maxLen + 4, 12), 45);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generic PDF Generator using PDFKit
 */
export const exportToPDF = async (reportTitle, columns, dataRows, filterSummary = '') => {
  ensureTempDirExists();

  return new Promise((resolve, reject) => {
    try {
      const isLandscape = columns.length > 5;
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: isLandscape ? 'landscape' : 'portrait',
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX = doc.page.margins.left;
      let startY = doc.page.margins.top;

      // Header Banner
      doc
        .rect(startX, startY, pageWidth, 40)
        .fill('#1F2937');

      doc
        .fillColor('#FFFFFF')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(reportTitle, startX + 12, startY + 10, { width: pageWidth - 24, align: 'left' });

      startY += 48;

      // Report Info Bar
      doc
        .fillColor('#4B5563')
        .fontSize(9)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()} | Total Records: ${dataRows.length} ${filterSummary ? `| Filters: ${filterSummary}` : ''}`, startX, startY);

      startY += 18;

      // Calculate column widths
      const numCols = columns.length;
      const colWidth = pageWidth / numCols;

      // Draw Table Header
      const drawTableHeader = (y) => {
        doc.rect(startX, y, pageWidth, 22).fill('#2563EB');
        let currentX = startX;

        columns.forEach((col) => {
          doc
            .fillColor('#FFFFFF')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(col.header, currentX + 4, y + 6, {
              width: colWidth - 8,
              align: 'left',
              height: 14,
              ellipsis: true,
            });
          currentX += colWidth;
        });

        return y + 22;
      };

      let currentY = drawTableHeader(startY);

      // Draw Data Rows
      dataRows.forEach((row, rowIndex) => {
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        if (currentY + 20 > pageHeight) {
          doc.addPage();
          currentY = doc.page.margins.top;
          currentY = drawTableHeader(currentY);
        }

        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.rect(startX, currentY, pageWidth, 18).fill('#F9FAFB');
        }

        let currentX = startX;
        columns.forEach((col) => {
          const rawVal = row[col.key];
          const textVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

          doc
            .fillColor('#1F2937')
            .fontSize(8)
            .font('Helvetica')
            .text(textVal, currentX + 4, currentY + 4, {
              width: colWidth - 8,
              align: 'left',
              height: 12,
              ellipsis: true,
            });

          currentX += colWidth;
        });

        // Row border
        doc
          .moveTo(startX, currentY + 18)
          .lineTo(startX + pageWidth, currentY + 18)
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .stroke();

        currentY += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Report 1: Manufacturing Order Report
 */
export const getManufacturingOrdersReport = async (query = {}) => {
  const filters = parseReportFilters(query);
  const matchStage = {};

  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
    if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
  }

  if (filters.productId) {
    matchStage.finishedProduct = new mongoose.Types.ObjectId(filters.productId);
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  const count = await ManufacturingOrder.countDocuments(matchStage);
  validateMaxRows(count);

  const orders = await ManufacturingOrder.find(matchStage)
    .populate('finishedProduct', 'name sku unitOfMeasure')
    .sort({ createdAt: -1 })
    .lean();

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

  const dataRows = orders.map((mo) => ({
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

  return { title: 'Manufacturing Orders Report', columns, dataRows, count };
};

/**
 * Report 2: Production / Throughput Report
 */
export const getThroughputReport = async (query = {}) => {
  const filters = parseReportFilters(query);
  const matchStage = {
    movementType: 'FINISHED_GOODS_PRODUCTION',
  };

  if (filters.startDate || filters.endDate) {
    matchStage.movementDate = {};
    if (filters.startDate) matchStage.movementDate.$gte = filters.startDate;
    if (filters.endDate) matchStage.movementDate.$lte = filters.endDate;
  }

  if (filters.productId) {
    matchStage.product = new mongoose.Types.ObjectId(filters.productId);
  }

  if (filters.manufacturingOrderId) {
    matchStage.manufacturingOrder = new mongoose.Types.ObjectId(filters.manufacturingOrderId);
  }

  const count = await StockLedger.countDocuments(matchStage);
  validateMaxRows(count);

  const ledgers = await StockLedger.find(matchStage)
    .populate('product', 'name sku unitOfMeasure')
    .populate('manufacturingOrder', 'moNumber')
    .populate('performedBy', 'fullName email')
    .sort({ movementDate: -1 })
    .lean();

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

  const dataRows = ledgers.map((item) => ({
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

  return { title: 'Production Throughput Report', columns, dataRows, count };
};

/**
 * Report 3: Work Order Report
 */
export const getWorkOrderReport = async (query = {}) => {
  const filters = parseReportFilters(query);
  const matchStage = {};

  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
    if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
  }

  if (filters.manufacturingOrderId) {
    matchStage.manufacturingOrder = new mongoose.Types.ObjectId(filters.manufacturingOrderId);
  }

  if (filters.workCenterId) {
    matchStage.workCenter = new mongoose.Types.ObjectId(filters.workCenterId);
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  const count = await WorkOrder.countDocuments(matchStage);
  validateMaxRows(count);

  const workOrders = await WorkOrder.find(matchStage)
    .populate('manufacturingOrder', 'moNumber')
    .populate('workCenter', 'name code')
    .populate('assignedTo', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

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

  const dataRows = workOrders.map((wo) => ({
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

  return { title: 'Work Orders Report', columns, dataRows, count };
};

/**
 * Report 4: Stock Ledger Report
 */
export const getStockLedgerReport = async (query = {}) => {
  const filters = parseReportFilters(query);
  const matchStage = {};

  if (filters.startDate || filters.endDate) {
    matchStage.movementDate = {};
    if (filters.startDate) matchStage.movementDate.$gte = filters.startDate;
    if (filters.endDate) matchStage.movementDate.$lte = filters.endDate;
  }

  if (filters.productId) {
    matchStage.product = new mongoose.Types.ObjectId(filters.productId);
  }

  if (filters.manufacturingOrderId) {
    matchStage.manufacturingOrder = new mongoose.Types.ObjectId(filters.manufacturingOrderId);
  }

  if (filters.movementType) {
    matchStage.movementType = filters.movementType;
  }

  const count = await StockLedger.countDocuments(matchStage);
  validateMaxRows(count);

  const ledgers = await StockLedger.find(matchStage)
    .populate('product', 'name sku unitOfMeasure')
    .populate('manufacturingOrder', 'moNumber')
    .populate('performedBy', 'fullName email')
    .sort({ movementDate: -1 })
    .lean();

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

  const dataRows = ledgers.map((item) => ({
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

  return { title: 'Stock Ledger Report', columns, dataRows, count };
};

/**
 * Report 5: Product Stock Report
 */
export const getProductStockReport = async (query = {}) => {
  const matchStage = {};

  if (query.category) {
    matchStage.category = String(query.category).trim();
  }

  if (query.isRawMaterial !== undefined) {
    matchStage.isRawMaterial = query.isRawMaterial === 'true' || query.isRawMaterial === true;
  }

  if (query.isFinishedGood !== undefined) {
    matchStage.isFinishedGood = query.isFinishedGood === 'true' || query.isFinishedGood === true;
  }

  if (query.isActive !== undefined) {
    matchStage.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const count = await Product.countDocuments(matchStage);
  validateMaxRows(count);

  const products = await Product.find(matchStage)
    .sort({ name: 1 })
    .lean();

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

  const dataRows = products.map((p) => ({
    sku: p.sku || '',
    name: p.name || '',
    category: p.category || 'General',
    unitOfMeasure: p.unitOfMeasure || 'pcs',
    stockOnHand: p.stockOnHand || 0,
    reorderLevel: p.reorderLevel || 0,
    costPrice: p.costPrice || 0,
    salesPrice: p.salesPrice || 0,
    type: p.isRawMaterial ? 'Raw Material' : p.isFinishedGood ? 'Finished Good' : 'Standard',
    status: p.isActive ? 'Active' : 'Inactive',
  }));

  return { title: 'Product Inventory Stock Report', columns, dataRows, count };
};

export const reportService = {
  parseReportFilters,
  exportToExcel,
  exportToPDF,
  getManufacturingOrdersReport,
  getThroughputReport,
  getWorkOrderReport,
  getStockLedgerReport,
  getProductStockReport,
};

export default reportService;
