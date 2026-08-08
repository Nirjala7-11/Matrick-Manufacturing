import express from 'express';
import {
  getStockLedger,
  getProductStockLedger,
  getMOStockLedger,
  getCurrentStock,
  checkAvailability,
  consumeRawMaterial,
  addFinishedGoods,
  adjustStock,
} from '../controllers/stockLedger.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All Stock Ledger routes require authentication
router.use(protect);

// GET /api/stock-ledger - List stock movements with filtering
router.get('/', getStockLedger);

// POST /api/stock-ledger/availability - Batch component availability evaluation
router.post('/availability', checkAvailability);
router.get('/availability', checkAvailability);

// GET /api/stock-ledger/product/:productId - Get movement history for a product
router.get('/product/:productId', getProductStockLedger);

// GET /api/stock-ledger/manufacturing-order/:moId - Get movements for an MO
router.get('/manufacturing-order/:moId', getMOStockLedger);

// GET /api/stock-ledger/stock/:productId - Get current product stock level
router.get('/stock/:productId', getCurrentStock);

// POST /api/stock-ledger/consume - Consume raw materials/components (admin, manager, operator)
router.post('/consume', requireRole('admin', 'manager', 'operator'), consumeRawMaterial);

// POST /api/stock-ledger/produce - Record finished goods production output (admin, manager, operator)
router.post('/produce', requireRole('admin', 'manager', 'operator'), addFinishedGoods);

// POST /api/stock-ledger/adjust - Manual stock level adjustment (admin, manager)
router.post('/adjust', requireRole('admin', 'manager'), adjustStock);

export default router;
