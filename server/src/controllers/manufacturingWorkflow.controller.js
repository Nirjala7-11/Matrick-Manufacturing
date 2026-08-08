import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import manufacturingWorkflowService from '../services/manufacturingWorkflow.service.js';

/**
 * Confirm a Manufacturing Order and re-evaluate live component availability.
 * POST /api/manufacturing-workflow/:moId/confirm
 */
export const confirmManufacturingOrder = asyncHandler(async (req, res) => {
  const result = await manufacturingWorkflowService.confirmManufacturingOrder(req.params.moId);
  return sendSuccess(res, 'Manufacturing Order confirmed successfully', result, 200);
});

/**
 * Generate Work Orders automatically for a Manufacturing Order based on BOM operations.
 * POST /api/manufacturing-workflow/:moId/generate-work-orders
 */
export const generateWorkOrders = asyncHandler(async (req, res) => {
  const workOrders = await manufacturingWorkflowService.generateManufacturingWorkOrders(req.params.moId);
  return sendSuccess(res, 'Work Orders generated successfully for Manufacturing Order', workOrders, 201);
});

/**
 * Start production execution for a Manufacturing Order.
 * POST /api/manufacturing-workflow/:moId/start
 */
export const startManufacturingOrder = asyncHandler(async (req, res) => {
  const result = await manufacturingWorkflowService.startManufacturingOrder(req.params.moId);
  return sendSuccess(res, 'Manufacturing Order started successfully', result, 200);
});

/**
 * Consume required component stock for a Manufacturing Order.
 * POST /api/manufacturing-workflow/:moId/consume-components
 */
export const consumeComponents = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const result = await manufacturingWorkflowService.consumeRequiredComponents(req.params.moId, userId);
  return sendSuccess(res, result.message || 'Component stock consumed successfully', result, 200);
});

/**
 * Record finished goods production output for a Manufacturing Order.
 * POST /api/manufacturing-workflow/:moId/produce
 */
export const produceFinishedGoods = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const { quantity } = req.body;
  const result = await manufacturingWorkflowService.produceFinishedGoods(req.params.moId, quantity, userId);
  return sendSuccess(res, result.message || 'Finished goods production output recorded', result, 201);
});

/**
 * Complete a Manufacturing Order.
 * POST /api/manufacturing-workflow/:moId/complete
 */
export const completeManufacturingOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return sendError(res, 'User identity could not be verified', 'UNAUTHORIZED', 401);
  }

  const completedMO = await manufacturingWorkflowService.completeManufacturingOrder(req.params.moId, userId);
  return sendSuccess(res, 'Manufacturing Order marked completed successfully', completedMO, 200);
});

/**
 * Get comprehensive manufacturing execution summary for an MO.
 * GET /api/manufacturing-workflow/:moId/status
 */
export const getManufacturingExecutionStatus = asyncHandler(async (req, res) => {
  const statusSummary = await manufacturingWorkflowService.getManufacturingExecutionStatus(req.params.moId);
  return sendSuccess(res, 'Manufacturing Order execution status retrieved', statusSummary, 200);
});

export const manufacturingWorkflowController = {
  confirmManufacturingOrder,
  generateWorkOrders,
  startManufacturingOrder,
  consumeComponents,
  produceFinishedGoods,
  completeManufacturingOrder,
  getManufacturingExecutionStatus,
};

export default manufacturingWorkflowController;
