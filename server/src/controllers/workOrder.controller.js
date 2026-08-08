import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import workOrderService from '../services/workOrder.service.js';

/**
 * Generate Work Orders automatically for a Manufacturing Order.
 * POST /api/work-orders/generate/:moId
 */
export const generateWorkOrdersForMO = asyncHandler(async (req, res) => {
  const { moId } = req.params;
  const workOrders = await workOrderService.generateWorkOrdersForMO(moId);
  return sendSuccess(res, 'Work Orders generated successfully', workOrders, 201);
});

/**
 * Create a custom Work Order manually.
 * POST /api/work-orders
 */
export const createWorkOrder = asyncHandler(async (req, res) => {
  const { manufacturingOrder, operationName, workCenter } = req.body;

  if (!manufacturingOrder || !operationName || !workCenter) {
    return sendError(res, 'Manufacturing Order, operation name, and Work Center are required', 'MISSING_FIELDS', 400);
  }

  const workOrder = await workOrderService.createWorkOrder(req.body);
  return sendSuccess(res, 'Work Order created successfully', workOrder, 201);
});

/**
 * Get all Work Orders with filtering, searching, and pagination.
 * GET /api/work-orders
 */
export const getWorkOrders = asyncHandler(async (req, res) => {
  const result = await workOrderService.getWorkOrders(req.query);
  return sendSuccess(res, 'Work Orders retrieved successfully', result.workOrders, 200, result.meta);
});

/**
 * Get Work Order by ID.
 * GET /api/work-orders/:id
 */
export const getWorkOrderById = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.getWorkOrderById(req.params.id);
  return sendSuccess(res, 'Work Order retrieved successfully', workOrder, 200);
});

/**
 * Get all Work Orders for a given Manufacturing Order.
 * GET /api/work-orders/manufacturing-order/:moId
 */
export const getWorkOrdersByMO = asyncHandler(async (req, res) => {
  const workOrders = await workOrderService.getWorkOrdersByMO(req.params.moId);
  return sendSuccess(res, 'Work Orders for Manufacturing Order retrieved successfully', workOrders, 200);
});

/**
 * Get all Work Orders for a given Work Center.
 * GET /api/work-orders/work-center/:workCenterId
 */
export const getWorkOrdersByWorkCenter = asyncHandler(async (req, res) => {
  const workOrders = await workOrderService.getWorkOrdersByWorkCenter(req.params.workCenterId);
  return sendSuccess(res, 'Work Orders for Work Center retrieved successfully', workOrders, 200);
});

/**
 * Update Work Order planning fields.
 * PUT /api/work-orders/:id
 */
export const updateWorkOrder = asyncHandler(async (req, res) => {
  const updatedWO = await workOrderService.updateWorkOrder(req.params.id, req.body);
  return sendSuccess(res, 'Work Order updated successfully', updatedWO, 200);
});

/**
 * Start execution of a Work Order.
 * POST /api/work-orders/:id/start
 */
export const startWorkOrder = asyncHandler(async (req, res) => {
  const operatorId = req.user?._id;
  const startedWO = await workOrderService.startWorkOrder(req.params.id, operatorId);
  return sendSuccess(res, 'Work Order started successfully', startedWO, 200);
});

/**
 * Block a Work Order (e.g., breakdown, delay, missing materials).
 * POST /api/work-orders/:id/block
 */
export const blockWorkOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const blockedWO = await workOrderService.blockWorkOrder(req.params.id, reason);
  return sendSuccess(res, 'Work Order marked blocked', blockedWO, 200);
});

/**
 * Complete execution of a Work Order.
 * POST /api/work-orders/:id/complete
 */
export const completeWorkOrder = asyncHandler(async (req, res) => {
  const completedWO = await workOrderService.completeWorkOrder(req.params.id);
  return sendSuccess(res, 'Work Order marked completed successfully', completedWO, 200);
});

/**
 * Cancel a Work Order.
 * POST /api/work-orders/:id/cancel
 */
export const cancelWorkOrder = asyncHandler(async (req, res) => {
  const cancelledWO = await workOrderService.cancelWorkOrder(req.params.id);
  return sendSuccess(res, 'Work Order cancelled successfully', cancelledWO, 200);
});

export const workOrderController = {
  generateWorkOrdersForMO,
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  getWorkOrdersByMO,
  getWorkOrdersByWorkCenter,
  updateWorkOrder,
  startWorkOrder,
  blockWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
};

export default workOrderController;
