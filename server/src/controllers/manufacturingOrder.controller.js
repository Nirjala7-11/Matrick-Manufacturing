import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import manufacturingOrderService from '../services/manufacturingOrder.service.js';

/**
 * Create a new Manufacturing Order.
 * POST /api/manufacturing-orders
 */
export const createMO = asyncHandler(async (req, res) => {
  const { finishedProduct, quantity } = req.body;

  if (!finishedProduct || quantity === undefined) {
    return sendError(res, 'Finished product reference and quantity are required', 'MISSING_FIELDS', 400);
  }

  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const mo = await manufacturingOrderService.createMO(req.body, userId);
  return sendSuccess(res, 'Manufacturing Order created successfully', mo, 201);
});

/**
 * Get all Manufacturing Orders with filtering, searching, and pagination.
 * GET /api/manufacturing-orders
 */
export const getMOs = asyncHandler(async (req, res) => {
  const result = await manufacturingOrderService.getMOs(req.query);
  return sendSuccess(res, 'Manufacturing Orders retrieved successfully', result.orders, 200, result.meta);
});

/**
 * Get Manufacturing Order by ID.
 * GET /api/manufacturing-orders/:id
 */
export const getMOById = asyncHandler(async (req, res) => {
  const mo = await manufacturingOrderService.getMOById(req.params.id);
  return sendSuccess(res, 'Manufacturing Order retrieved successfully', mo, 200);
});

/**
 * Update planning fields or quantity of a Manufacturing Order.
 * PUT /api/manufacturing-orders/:id
 */
export const updateMO = asyncHandler(async (req, res) => {
  const updatedMO = await manufacturingOrderService.updateMO(req.params.id, req.body);
  return sendSuccess(res, 'Manufacturing Order updated successfully', updatedMO, 200);
});

/**
 * Confirm a Draft Manufacturing Order.
 * POST /api/manufacturing-orders/:id/confirm
 */
export const confirmMO = asyncHandler(async (req, res) => {
  const confirmedMO = await manufacturingOrderService.confirmMO(req.params.id);
  return sendSuccess(res, 'Manufacturing Order confirmed successfully', confirmedMO, 200);
});

/**
 * Start execution of a Confirmed Manufacturing Order.
 * POST /api/manufacturing-orders/:id/start
 */
export const startMO = asyncHandler(async (req, res) => {
  const startedMO = await manufacturingOrderService.startMO(req.params.id);
  return sendSuccess(res, 'Manufacturing Order started successfully', startedMO, 200);
});

/**
 * Complete an In-Progress Manufacturing Order.
 * POST /api/manufacturing-orders/:id/complete
 */
export const completeMO = asyncHandler(async (req, res) => {
  const completedMO = await manufacturingOrderService.completeMO(req.params.id);
  return sendSuccess(res, 'Manufacturing Order marked completed successfully', completedMO, 200);
});

/**
 * Cancel a Manufacturing Order.
 * POST /api/manufacturing-orders/:id/cancel
 */
export const cancelMO = asyncHandler(async (req, res) => {
  const cancelledMO = await manufacturingOrderService.cancelMO(req.params.id);
  return sendSuccess(res, 'Manufacturing Order cancelled successfully', cancelledMO, 200);
});

/**
 * Check component availability for a Manufacturing Order.
 * GET /api/manufacturing-orders/:id/availability
 */
export const checkComponentAvailability = asyncHandler(async (req, res) => {
  const result = await manufacturingOrderService.checkComponentAvailability(req.params.id);
  return sendSuccess(res, 'Component availability calculated successfully', result, 200);
});

export const manufacturingOrderController = {
  createMO,
  getMOs,
  getMOById,
  updateMO,
  confirmMO,
  startMO,
  completeMO,
  cancelMO,
  checkComponentAvailability,
};

export default manufacturingOrderController;
