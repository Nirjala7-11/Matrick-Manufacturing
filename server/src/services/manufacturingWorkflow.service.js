import mongoose from 'mongoose';
import ManufacturingOrder from '../models/ManufacturingOrder.js';
import StockLedger from '../models/StockLedger.js';
import WorkOrder from '../models/WorkOrder.js';
import manufacturingOrderService from './manufacturingOrder.service.js';
import workOrderService from './workOrder.service.js';
import stockLedgerService from './stockLedger.service.js';

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
 * Confirm a Manufacturing Order and evaluate live component availability.
 * Idempotent: If already confirmed, returns the current state.
 */
export const confirmManufacturingOrder = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status === 'confirmed') {
    return await manufacturingOrderService.getMOById(moId);
  }

  if (mo.status !== 'draft') {
    throw createError(
      `Cannot confirm Manufacturing Order in status '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  return await manufacturingOrderService.confirmMO(moId);
};

/**
 * Generate Work Orders for an MO based on its BOM operations.
 * Idempotent: Returns existing Work Orders if already generated.
 */
export const generateManufacturingWorkOrders = async (moId) => {
  return await workOrderService.generateWorkOrdersForMO(moId);
};

/**
 * Start production for a Manufacturing Order.
 * Automatically generates Work Orders if not yet present and updates status to in_progress.
 */
export const startManufacturingOrder = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status === 'in_progress') {
    return await manufacturingOrderService.getMOById(moId);
  }

  if (mo.status === 'draft') {
    await manufacturingOrderService.confirmMO(moId);
  } else if (!['confirmed'].includes(mo.status)) {
    throw createError(
      `Cannot start Manufacturing Order in status '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Ensure Work Orders exist
  await workOrderService.generateWorkOrdersForMO(moId);

  // Transition MO status to in_progress
  return await manufacturingOrderService.startMO(moId);
};

/**
 * Consume required raw materials/components for a Manufacturing Order.
 * Idempotent: Tracks already consumed quantities to prevent double consumption.
 */
export const consumeRequiredComponents = async (moId, userId) => {
  if (!userId) {
    throw createError('User identity is required to record component consumption', 400, 'MISSING_USER');
  }

  const mo = await ManufacturingOrder.findById(moId).populate('componentRequirements.product');
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(mo.status)) {
    throw createError(
      `Cannot consume components for an MO in '${mo.status}' status`,
      400,
      'INVALID_STATUS'
    );
  }

  if (!mo.componentRequirements || mo.componentRequirements.length === 0) {
    throw createError('Manufacturing Order has no defined component requirements', 400, 'NO_COMPONENTS');
  }

  // Pre-validate that all remaining unconsumed components have sufficient stock
  const consumptionTasks = [];
  for (const comp of mo.componentRequirements) {
    const prod = comp.product;
    const requiredTotal = comp.requiredQuantity || 0;
    const alreadyConsumed = comp.consumedQuantity || 0;
    const remainingToConsume = Math.max(0, requiredTotal - alreadyConsumed);

    if (remainingToConsume > 0) {
      if (!prod) {
        throw createError('Associated component product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if ((prod.stockOnHand || 0) < remainingToConsume) {
        throw createError(
          `Insufficient stock to consume component '${prod.name}' (SKU: ${prod.sku}). Stock: ${prod.stockOnHand || 0}, Required: ${remainingToConsume}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      consumptionTasks.push({
        compRef: comp,
        productId: prod._id,
        quantityToConsume: remainingToConsume,
      });
    }
  }

  if (consumptionTasks.length === 0) {
    // All components have already been fully consumed
    return {
      message: 'All component requirements have already been fully consumed for this Manufacturing Order.',
      manufacturingOrder: await manufacturingOrderService.getMOById(moId),
      consumedEntries: await StockLedger.find({
        manufacturingOrder: moId,
        movementType: 'RAW_MATERIAL_CONSUMPTION',
      }),
    };
  }

  // Process consumption sequentially
  const createdEntries = [];
  for (const task of consumptionTasks) {
    const ledgerEntry = await stockLedgerService.consumeRawMaterial({
      productId: task.productId,
      quantity: task.quantityToConsume,
      manufacturingOrderId: mo._id,
      reason: `Component consumption for Manufacturing Order ${mo.moNumber}`,
      userId,
    });

    task.compRef.consumedQuantity = (task.compRef.consumedQuantity || 0) + task.quantityToConsume;
    createdEntries.push(ledgerEntry);
  }

  await mo.save();

  return {
    message: `Successfully consumed raw materials for ${consumptionTasks.length} component(s)`,
    manufacturingOrder: await manufacturingOrderService.getMOById(moId),
    consumedEntries: createdEntries,
  };
};

/**
 * Record finished goods production output for a Manufacturing Order.
 * Idempotent: Prevents producing more than planned MO quantity.
 */
export const produceFinishedGoods = async (moId, quantityInput, userId) => {
  if (!userId) {
    throw createError('User identity is required to record finished goods output', 400, 'MISSING_USER');
  }

  const mo = await ManufacturingOrder.findById(moId).populate('finishedProduct');
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (['draft', 'cancelled'].includes(mo.status)) {
    throw createError(
      `Cannot produce finished goods for an MO in '${mo.status}' status`,
      400,
      'INVALID_STATUS'
    );
  }

  // Calculate existing produced quantity from StockLedger
  const productionLedgers = await StockLedger.find({
    manufacturingOrder: moId,
    movementType: 'FINISHED_GOODS_PRODUCTION',
  });

  const alreadyProduced = productionLedgers.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const plannedQuantity = mo.quantity || 1;
  const remainingQuantity = Math.max(0, plannedQuantity - alreadyProduced);

  let qtyToProduce = quantityInput !== undefined && quantityInput !== null ? Number(quantityInput) : remainingQuantity;

  if (isNaN(qtyToProduce) || qtyToProduce <= 0) {
    throw createError('Production quantity must be a positive number', 400, 'INVALID_QUANTITY');
  }

  if (alreadyProduced + qtyToProduce > plannedQuantity) {
    throw createError(
      `Cannot produce ${qtyToProduce} unit(s). Planned quantity is ${plannedQuantity}, already produced ${alreadyProduced} unit(s). Max allowed: ${remainingQuantity}`,
      400,
      'EXCEEDS_PLANNED_QUANTITY'
    );
  }

  const prodId = mo.finishedProduct._id || mo.finishedProduct;

  const ledgerEntry = await stockLedgerService.addFinishedGoods({
    productId: prodId,
    quantity: qtyToProduce,
    manufacturingOrderId: mo._id,
    reason: `Finished goods production output for MO ${mo.moNumber}`,
    userId,
  });

  return {
    message: `Recorded ${qtyToProduce} unit(s) of finished goods output for MO ${mo.moNumber}`,
    plannedQuantity,
    totalProducedQuantity: alreadyProduced + qtyToProduce,
    remainingQuantity: plannedQuantity - (alreadyProduced + qtyToProduce),
    ledgerEntry,
  };
};

/**
 * Complete a Manufacturing Order once all work orders and production outputs are satisfied.
 */
export const completeManufacturingOrder = async (moId, userId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status === 'completed') {
    return await manufacturingOrderService.getMOById(moId);
  }

  if (['draft', 'cancelled'].includes(mo.status)) {
    throw createError(
      `Cannot complete a Manufacturing Order in '${mo.status}' status`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Check work orders if present
  const workOrders = await WorkOrder.find({ manufacturingOrder: moId });
  const pendingWOs = workOrders.filter((wo) => ['pending', 'ready', 'in_progress', 'blocked'].includes(wo.status));

  if (pendingWOs.length > 0) {
    throw createError(
      `Cannot complete MO: ${pendingWOs.length} Work Order(s) are still incomplete or blocked`,
      400,
      'INCOMPLETE_WORK_ORDERS'
    );
  }

  // Check finished goods output
  const productionLedgers = await StockLedger.find({
    manufacturingOrder: moId,
    movementType: 'FINISHED_GOODS_PRODUCTION',
  });

  const totalProduced = productionLedgers.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const plannedQuantity = mo.quantity || 1;

  if (totalProduced < plannedQuantity) {
    // Automatically record remaining finished goods output
    const remainingToProduce = plannedQuantity - totalProduced;
    await produceFinishedGoods(moId, remainingToProduce, userId);
  }

  // Complete MO
  return await manufacturingOrderService.completeMO(moId);
};

/**
 * Get comprehensive execution summary and status dashboard data for a Manufacturing Order.
 */
export const getManufacturingExecutionStatus = async (moId) => {
  const mo = await manufacturingOrderService.getMOById(moId);
  const workOrders = await workOrderService.getWorkOrdersByMO(moId);

  // Calculate Work Orders breakdown
  const woSummary = {
    total: workOrders.length,
    pending: workOrders.filter((wo) => wo.status === 'pending').length,
    ready: workOrders.filter((wo) => wo.status === 'ready').length,
    inProgress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    completed: workOrders.filter((wo) => wo.status === 'completed').length,
    blocked: workOrders.filter((wo) => wo.status === 'blocked').length,
    cancelled: workOrders.filter((wo) => wo.status === 'cancelled').length,
  };

  // Calculate component availability & consumption breakdown
  const componentDetails = (mo.componentRequirements || []).map((comp) => {
    const prod = comp.product || {};
    const reqQty = comp.requiredQuantity || 0;
    const consumedQty = comp.consumedQuantity || 0;
    const availableStock = prod.stockOnHand || 0;

    return {
      productId: prod._id,
      productName: prod.name || 'Unknown',
      sku: prod.sku || 'N/A',
      unitOfMeasure: comp.unitOfMeasure || 'pcs',
      requiredQuantity: reqQty,
      consumedQuantity: consumedQty,
      availableStock,
      sufficientStock: availableStock >= Math.max(0, reqQty - consumedQty),
    };
  });

  // Calculate finished goods output from ledger
  const productionLedgers = await StockLedger.find({
    manufacturingOrder: moId,
    movementType: 'FINISHED_GOODS_PRODUCTION',
  });

  const totalProduced = productionLedgers.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const plannedQuantity = mo.quantity || 1;

  return {
    manufacturingOrder: mo,
    status: mo.status,
    componentAvailabilityStatus: mo.componentAvailabilityStatus,
    components: componentDetails,
    workOrdersSummary: woSummary,
    workOrders,
    production: {
      plannedQuantity,
      producedQuantity: totalProduced,
      remainingQuantity: Math.max(0, plannedQuantity - totalProduced),
      isFullyProduced: totalProduced >= plannedQuantity,
    },
  };
};

export const manufacturingWorkflowService = {
  confirmManufacturingOrder,
  generateManufacturingWorkOrders,
  startManufacturingOrder,
  consumeRequiredComponents,
  produceFinishedGoods,
  completeManufacturingOrder,
  getManufacturingExecutionStatus,
};

export default manufacturingWorkflowService;
