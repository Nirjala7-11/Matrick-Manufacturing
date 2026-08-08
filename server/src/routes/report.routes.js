import express from 'express';
import {
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
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All report export endpoints require authentication
router.use(protect);

// 1. Manufacturing Orders Reports
router.get('/manufacturing-orders/excel', exportManufacturingOrdersExcel);
router.get('/manufacturing-orders/pdf', exportManufacturingOrdersPDF);

// 2. Production Throughput Reports
router.get('/throughput/excel', exportThroughputExcel);
router.get('/throughput/pdf', exportThroughputPDF);

// 3. Work Orders Reports
router.get('/work-orders/excel', exportWorkOrdersExcel);
router.get('/work-orders/pdf', exportWorkOrdersPDF);

// 4. Stock Ledger Reports
router.get('/stock-ledger/excel', exportStockLedgerExcel);
router.get('/stock-ledger/pdf', exportStockLedgerPDF);

// 5. Product Stock Inventory Reports
router.get('/product-stock/excel', exportProductStockExcel);
router.get('/product-stock/pdf', exportProductStockPDF);

export default router;
