import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import stockLedgerService from '../services/stockLedger.service.js';

/**
 * Get stock ledger history entries with filtering, searching, and pagination.
 * GET /api/stock-ledger
 */
export const getStockLedger = asyncHandler(async (req, res) => {
  const result = await stockLedgerService.getStockLedgerEntries(req.query);
  return sendSuccess(res, 'Stock ledger entries retrieved successfully', result.entries, 200, result.meta);
});

/**
 * Get stock ledger history for a specific product.
 * GET /api/stock-ledger/product/:productId
 */
export const getProductStockLedger = asyncHandler(async (req, res) => {
  const result = await stockLedgerService.getProductLedgerEntries(req.params.productId, req.query);
  return sendSuccess(res, 'Product stock ledger history retrieved successfully', result.entries, 200, result.meta);
});

/**
 * Get stock ledger history for a specific Manufacturing Order.
 * GET /api/stock-ledger/manufacturing-order/:moId
 */
export const getMOStockLedger = asyncHandler(async (req, res) => {
  const result = await stockLedgerService.getMOLedgerEntries(req.params.moId, req.query);
  return sendSuccess(res, 'Manufacturing Order stock movements retrieved successfully', result.entries, 200, result.meta);
});

/**
 * Get current stock level for a product.
 * GET /api/stock-ledger/stock/:productId
 */
export const getCurrentStock = asyncHandler(async (req, res) => {
  const stockInfo = await stockLedgerService.getCurrentStock(req.params.productId);
  return sendSuccess(res, 'Current stock retrieved successfully', stockInfo, 200);
});

/**
 * Batch component availability check.
 * POST /api/stock-ledger/availability
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const components = req.body.components || req.body;
  if (!Array.isArray(components)) {
    return sendError(res, 'Please provide an array of components to check', 'INVALID_INPUT', 400);
  }

  const availability = await stockLedgerService.checkStockAvailability(components);
  return sendSuccess(res, 'Component availability evaluated successfully', availability, 200);
});

/**
 * Consume raw materials for manufacturing.
 * POST /api/stock-ledger/consume
 */
export const consumeRawMaterial = asyncHandler(async (req, res) => {
  const { productId, quantity, manufacturingOrderId, workOrderId, reason } = req.body;

  if (!productId || quantity === undefined) {
    return sendError(res, 'Product reference and quantity are required', 'MISSING_FIELDS', 400);
  }

  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const result = await stockLedgerService.consumeRawMaterial({
    productId,
    quantity,
    manufacturingOrderId,
    workOrderId,
    reason,
    userId,
  });

  return sendSuccess(res, 'Raw material consumption recorded successfully', result, 201);
});

/**
 * Record finished goods production output.
 * POST /api/stock-ledger/produce
 */
export const addFinishedGoods = asyncHandler(async (req, res) => {
  const { productId, quantity, manufacturingOrderId, workOrderId, reason } = req.body;

  if (!productId || quantity === undefined) {
    return sendError(res, 'Product reference and quantity are required', 'MISSING_FIELDS', 400);
  }

  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const result = await stockLedgerService.addFinishedGoods({
    productId,
    quantity,
    manufacturingOrderId,
    workOrderId,
    reason,
    userId,
  });

  return sendSuccess(res, 'Finished goods production output recorded successfully', result, 201);
});

/**
 * Perform manual stock adjustment.
 * POST /api/stock-ledger/adjust
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, newStockOnHand, quantity, reason } = req.body;

  if (!productId || (newStockOnHand === undefined && quantity === undefined)) {
    return sendError(res, 'Product reference and either newStockOnHand or quantity are required', 'MISSING_FIELDS', 400);
  }

  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const result = await stockLedgerService.adjustStock({
    productId,
    newStockOnHand,
    quantity,
    reason,
    userId,
  });

  return sendSuccess(res, 'Stock adjustment performed successfully', result, 200);
});

export const stockLedgerController = {
  getStockLedger,
  getProductStockLedger,
  getMOStockLedger,
  getCurrentStock,
  checkAvailability,
  consumeRawMaterial,
  addFinishedGoods,
  adjustStock,
};

export default stockLedgerController;
