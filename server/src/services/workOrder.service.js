import WorkOrder from '../models/WorkOrder.js';
import ManufacturingOrder from '../models/ManufacturingOrder.js';
import BOM from '../models/BOM.js';
import WorkCenter from '../models/WorkCenter.js';

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
 * Generate Work Orders automatically for a Manufacturing Order based on its BOM operations
 */
export const generateWorkOrdersForMO = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  // Check if Work Orders have already been generated for this MO
  const existingWOs = await WorkOrder.find({ manufacturingOrder: moId }).sort({ sequence: 1 });
  if (existingWOs.length > 0) {
    return await getWorkOrdersByMO(moId);
  }

  // Fetch populated BOM with operations
  const bom = await BOM.findById(mo.bom);
  if (!bom) {
    throw createError('Associated Bill of Materials not found', 404, 'BOM_NOT_FOUND');
  }

  if (!Array.isArray(bom.operations) || bom.operations.length === 0) {
    throw createError('Associated Bill of Materials has no operations defined', 400, 'NO_BOM_OPERATIONS');
  }

  // Sort operations by sequence
  const sortedOperations = [...bom.operations].sort((a, b) => a.sequence - b.sequence);

  // Generate WorkOrder documents
  const woDocs = [];
  for (let i = 0; i < sortedOperations.length; i++) {
    const op = sortedOperations[i];
    const seqStr = String(op.sequence || i + 1).padStart(2, '0');
    const woNumber = `${mo.moNumber}-WO-${seqStr}`;

    woDocs.push({
      woNumber,
      manufacturingOrder: mo._id,
      operationName: op.name,
      sequence: op.sequence || i + 1,
      workCenter: op.workCenter,
      plannedDurationMinutes: op.durationMinutes || 60,
      status: i === 0 ? 'ready' : 'pending', // First operation is ready, subsequent operations pending
      plannedStartDate: mo.plannedStartDate,
      plannedEndDate: mo.plannedEndDate,
    });
  }

  await WorkOrder.insertMany(woDocs);

  return await getWorkOrdersByMO(moId);
};

/**
 * Create a custom single Work Order manually
 */
export const createWorkOrder = async (woData) => {
  const { manufacturingOrder: moId, operationName, sequence, workCenter: wcId, plannedDurationMinutes, assignedOperator, notes } = woData;

  if (!moId || !operationName || !wcId) {
    throw createError('Manufacturing Order, operation name, and Work Center are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  const wc = await WorkCenter.findById(wcId);
  if (!wc) {
    throw createError('Work Center not found', 404, 'WORK_CENTER_NOT_FOUND');
  }

  const countForMO = await WorkOrder.countDocuments({ manufacturingOrder: moId });
  const seq = typeof sequence === 'number' ? sequence : countForMO + 1;
  const woNumber = `${mo.moNumber}-WO-CUST-${String(seq).padStart(2, '0')}`;

  const newWO = await WorkOrder.create({
    woNumber,
    manufacturingOrder: moId,
    operationName: operationName.trim(),
    sequence: seq,
    workCenter: wcId,
    plannedDurationMinutes: typeof plannedDurationMinutes === 'number' ? plannedDurationMinutes : 60,
    status: 'ready',
    assignedOperator: assignedOperator || undefined,
    notes: notes ? notes.trim() : '',
  });

  return await getWorkOrderById(newWO._id);
};

/**
 * Query Work Orders with pagination, search, and filters
 */
export const getWorkOrders = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.manufacturingOrder) {
    filter.manufacturingOrder = query.manufacturingOrder;
  }

  if (query.workCenter) {
    filter.workCenter = query.workCenter;
  }

  if (query.assignedOperator) {
    filter.assignedOperator = query.assignedOperator;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ woNumber: searchRegex }, { operationName: searchRegex }, { notes: searchRegex }];
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const [workOrders, total] = await Promise.all([
    WorkOrder.find(filter)
      .populate('manufacturingOrder', 'moNumber status finishedProduct quantity')
      .populate('workCenter', 'name code status capacityPerHour costPerHour')
      .populate('assignedOperator', 'firstName lastName email role')
      .sort({ sequence: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WorkOrder.countDocuments(filter),
  ]);

  return {
    workOrders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Fetch Work Order by ID with full population
 */
export const getWorkOrderById = async (woId) => {
  const wo = await WorkOrder.findById(woId)
    .populate({
      path: 'manufacturingOrder',
      select: 'moNumber status finishedProduct quantity bom plannedStartDate plannedEndDate',
      populate: { path: 'finishedProduct', select: 'name sku unitOfMeasure' },
    })
    .populate('workCenter', 'name code status capacityPerHour costPerHour isActive')
    .populate('assignedOperator', 'firstName lastName email role');

  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  return wo;
};

/**
 * Fetch all Work Orders for a given Manufacturing Order sorted by sequence
 */
export const getWorkOrdersByMO = async (moId) => {
  const workOrders = await WorkOrder.find({ manufacturingOrder: moId })
    .populate('workCenter', 'name code status capacityPerHour costPerHour')
    .populate('assignedOperator', 'firstName lastName email role')
    .sort({ sequence: 1 });

  return workOrders;
};

/**
 * Fetch all Work Orders assigned to a specific Work Center
 */
export const getWorkOrdersByWorkCenter = async (workCenterId) => {
  const workOrders = await WorkOrder.find({ workCenter: workCenterId })
    .populate({
      path: 'manufacturingOrder',
      select: 'moNumber status finishedProduct quantity',
      populate: { path: 'finishedProduct', select: 'name sku' },
    })
    .populate('assignedOperator', 'firstName lastName email role')
    .sort({ createdAt: -1 });

  return workOrders;
};

/**
 * Update permitted planning fields on a Work Order
 */
export const updateWorkOrder = async (woId, updateData) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(wo.status)) {
    throw createError(
      `Cannot update a Work Order in '${wo.status}' status`,
      400,
      'INVALID_STATUS_FOR_UPDATE'
    );
  }

  if (updateData.workCenter) {
    const wc = await WorkCenter.findById(updateData.workCenter);
    if (!wc) throw createError('Specified Work Center not found', 404, 'WORK_CENTER_NOT_FOUND');
    wo.workCenter = updateData.workCenter;
  }

  if (updateData.assignedOperator !== undefined) wo.assignedOperator = updateData.assignedOperator || undefined;
  if (updateData.plannedDurationMinutes !== undefined) wo.plannedDurationMinutes = updateData.plannedDurationMinutes;
  if (updateData.plannedStartDate) wo.plannedStartDate = new Date(updateData.plannedStartDate);
  if (updateData.plannedEndDate) wo.plannedEndDate = new Date(updateData.plannedEndDate);
  if (updateData.notes !== undefined) wo.notes = updateData.notes.trim();

  await wo.save();
  return await getWorkOrderById(wo._id);
};

/**
 * Start execution of a Work Order
 */
export const startWorkOrder = async (woId, operatorId) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  if (!['pending', 'ready', 'blocked'].includes(wo.status)) {
    throw createError(
      `Work Order cannot be started from '${wo.status}' status`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  wo.status = 'in_progress';
  wo.actualStartDate = wo.actualStartDate || new Date();
  if (operatorId && !wo.assignedOperator) {
    wo.assignedOperator = operatorId;
  }

  await wo.save();
  return await getWorkOrderById(wo._id);
};

/**
 * Block a Work Order (e.g. machine breakdown or material bottleneck)
 */
export const blockWorkOrder = async (woId, reason = '') => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(wo.status)) {
    throw createError(
      `Cannot block a Work Order in '${wo.status}' status`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  wo.status = 'blocked';
  if (reason) {
    wo.notes = wo.notes ? `${wo.notes}\n[BLOCKED REASON]: ${reason}` : `[BLOCKED REASON]: ${reason}`;
  }

  await wo.save();
  return await getWorkOrderById(wo._id);
};

/**
 * Complete execution of a Work Order
 */
export const completeWorkOrder = async (woId) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  if (wo.status !== 'in_progress') {
    throw createError(
      `Only 'in_progress' Work Orders can be completed. Current status: '${wo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const now = new Date();
  wo.status = 'completed';
  wo.actualEndDate = now;

  // Calculate actual duration in minutes
  if (wo.actualStartDate) {
    const diffMs = now.getTime() - new Date(wo.actualStartDate).getTime();
    wo.actualDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
  } else {
    wo.actualDurationMinutes = wo.plannedDurationMinutes;
  }

  await wo.save();

  // Promote next sequential pending WO for the same MO to 'ready'
  const nextWO = await WorkOrder.findOne({
    manufacturingOrder: wo.manufacturingOrder,
    sequence: { $gt: wo.sequence },
    status: 'pending',
  }).sort({ sequence: 1 });

  if (nextWO) {
    nextWO.status = 'ready';
    await nextWO.save();
  }

  return await getWorkOrderById(wo._id);
};

/**
 * Cancel a Work Order
 */
export const cancelWorkOrder = async (woId) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) {
    throw createError('Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(wo.status)) {
    throw createError(
      `Cannot cancel a Work Order in '${wo.status}' status`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  wo.status = 'cancelled';
  await wo.save();
  return await getWorkOrderById(wo._id);
};

export const workOrderService = {
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

export default workOrderService;
