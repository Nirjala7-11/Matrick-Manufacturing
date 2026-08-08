import mongoose from 'mongoose';
import StockLedger from '../models/StockLedger.js';
import Product from '../models/Product.js';
import ManufacturingOrder from '../models/ManufacturingOrder.js';
import WorkOrder from '../models/WorkOrder.js';

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
 * Helper to safely execute database actions inside a MongoDB session transaction,
 * falling back gracefully if transactions are not supported by the MongoDB deployment (e.g. standalone server).
 */
const executeInTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (err) {
    if (session) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
    }
    // Fallback if Mongo environment is standalone and does not support multi-document transactions
    if (
      err.message &&
      (err.message.includes('Transaction numbers are only allowed') ||
        err.message.includes('replica set') ||
        err.message.includes('standalone'))
    ) {
      return await workFn(null);
    }
    throw err;
  }
};

/**
 * Core atomic stock movement creation service
 */
export const createStockMovement = async (movementData) => {
  const {
    productId,
    movementType,
    quantity: inputQuantity,
    newStockOnHand,
    manufacturingOrderId,
    workOrderId,
    referenceType: inputRefType,
    referenceId,
    reason,
    userId,
  } = movementData;

  if (!productId) {
    throw createError('Product reference is required', 400, 'MISSING_PRODUCT');
  }

  if (!movementType || !['IN', 'OUT', 'ADJUSTMENT', 'RAW_MATERIAL_CONSUMPTION', 'FINISHED_GOODS_PRODUCTION'].includes(movementType)) {
    throw createError('Valid movement type is required', 400, 'INVALID_MOVEMENT_TYPE');
  }

  if (!userId) {
    throw createError('User reference is required for stock movements', 400, 'MISSING_USER');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (!product.isActive) {
    throw createError('Cannot process inventory movement for an inactive product', 400, 'INACTIVE_PRODUCT');
  }

  // Validate Manufacturing Order reference if provided
  let moDoc = null;
  if (manufacturingOrderId) {
    moDoc = await ManufacturingOrder.findById(manufacturingOrderId);
    if (!moDoc) {
      throw createError('Referenced Manufacturing Order not found', 404, 'MO_NOT_FOUND');
    }
  }

  // Validate Work Order reference if provided
  let woDoc = null;
  if (workOrderId) {
    woDoc = await WorkOrder.findById(workOrderId);
    if (!woDoc) {
      throw createError('Referenced Work Order not found', 404, 'WORK_ORDER_NOT_FOUND');
    }

    if (manufacturingOrderId && woDoc.manufacturingOrder.toString() !== manufacturingOrderId.toString()) {
      throw createError('Work Order does not belong to the specified Manufacturing Order', 400, 'WO_MO_MISMATCH');
    }
  }

  const stockBefore = product.stockOnHand || 0;
  let stockAfter = stockBefore;
  let moveQty = 0;

  if (movementType === 'ADJUSTMENT') {
    if (newStockOnHand !== undefined && newStockOnHand !== null) {
      const targetStock = Number(newStockOnHand);
      if (isNaN(targetStock) || targetStock < 0) {
        throw createError('Adjusted stock level cannot be negative', 400, 'INVALID_ADJUSTMENT_STOCK');
      }
      stockAfter = targetStock;
      moveQty = Math.abs(stockAfter - stockBefore);
    } else if (inputQuantity !== undefined && inputQuantity !== null) {
      const deltaQty = Number(inputQuantity);
      if (isNaN(deltaQty) || deltaQty <= 0) {
        throw createError('Adjustment quantity must be greater than zero', 400, 'INVALID_QUANTITY');
      }
      moveQty = deltaQty;
      // Default adjustment adds if positive, or sets target
      stockAfter = stockBefore + moveQty;
    } else {
      throw createError('Adjustment requires either new stock level or adjustment quantity', 400, 'INVALID_ADJUSTMENT');
    }
  } else if (['OUT', 'RAW_MATERIAL_CONSUMPTION'].includes(movementType)) {
    moveQty = Number(inputQuantity);
    if (isNaN(moveQty) || moveQty <= 0) {
      throw createError('Consumption quantity must be a positive number', 400, 'INVALID_QUANTITY');
    }

    if (stockBefore < moveQty) {
      throw createError(
        `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${stockBefore} ${product.unitOfMeasure || 'pcs'}, Requested: ${moveQty}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    stockAfter = stockBefore - moveQty;
  } else if (['IN', 'FINISHED_GOODS_PRODUCTION'].includes(movementType)) {
    moveQty = Number(inputQuantity);
    if (isNaN(moveQty) || moveQty <= 0) {
      throw createError('Production / IN quantity must be a positive number', 400, 'INVALID_QUANTITY');
    }

    stockAfter = stockBefore + moveQty;
  }

  // Determine referenceType
  let referenceType = inputRefType || 'OTHER';
  if (workOrderId) {
    referenceType = 'WORK_ORDER';
  } else if (manufacturingOrderId) {
    referenceType = 'MANUFACTURING_ORDER';
  } else if (movementType === 'ADJUSTMENT') {
    referenceType = 'MANUAL_ADJUSTMENT';
  }

  // Execute atomic update
  const createdLedger = await executeInTransaction(async (session) => {
    const opts = session ? { session } : {};

    // Update Product stockOnHand
    product.stockOnHand = stockAfter;
    await product.save(opts);

    // Create StockLedger entry
    const [ledger] = await StockLedger.create(
      [
        {
          product: product._id,
          movementType,
          quantity: moveQty,
          unitOfMeasure: product.unitOfMeasure || 'pcs',
          stockBefore,
          stockAfter,
          referenceType,
          referenceId: referenceId || (woDoc ? woDoc.woNumber : moDoc ? moDoc.moNumber : undefined),
          manufacturingOrder: manufacturingOrderId || undefined,
          workOrder: workOrderId || undefined,
          reason: reason ? reason.trim() : `${movementType} movement for ${product.name}`,
          performedBy: userId,
          movementDate: new Date(),
        },
      ],
      opts
    );

    return ledger;
  });

  return await getStockLedgerEntryById(createdLedger._id);
};

/**
 * Fetch a single stock ledger entry by ID
 */
export const getStockLedgerEntryById = async (id) => {
  const entry = await StockLedger.findById(id)
    .populate('product', 'name sku category unitOfMeasure stockOnHand')
    .populate('performedBy', 'firstName lastName email role')
    .populate('manufacturingOrder', 'moNumber status finishedProduct quantity')
    .populate('workOrder', 'woNumber operationName status');

  if (!entry) {
    throw createError('Stock ledger entry not found', 404, 'LEDGER_ENTRY_NOT_FOUND');
  }

  return entry;
};

/**
 * Consume raw materials or components
 */
export const consumeRawMaterial = async ({ productId, quantity, manufacturingOrderId, workOrderId, reason, userId }) => {
  return await createStockMovement({
    productId,
    movementType: 'RAW_MATERIAL_CONSUMPTION',
    quantity,
    manufacturingOrderId,
    workOrderId,
    reason: reason || 'Raw material consumption for manufacturing',
    userId,
  });
};

/**
 * Record finished goods production
 */
export const addFinishedGoods = async ({ productId, quantity, manufacturingOrderId, workOrderId, reason, userId }) => {
  return await createStockMovement({
    productId,
    movementType: 'FINISHED_GOODS_PRODUCTION',
    quantity,
    manufacturingOrderId,
    workOrderId,
    reason: reason || 'Finished goods production output',
    userId,
  });
};

/**
 * Perform manual stock adjustment
 */
export const adjustStock = async ({ productId, newStockOnHand, quantity, reason, userId }) => {
  return await createStockMovement({
    productId,
    movementType: 'ADJUSTMENT',
    newStockOnHand,
    quantity,
    reason: reason || 'Manual stock adjustment',
    userId,
  });
};

/**
 * Query stock ledger history with filters, search, and pagination
 */
export const getStockLedgerEntries = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.product || query.productId) {
    filter.product = query.product || query.productId;
  }

  if (query.movementType) {
    filter.movementType = query.movementType;
  }

  if (query.manufacturingOrder || query.moId) {
    filter.manufacturingOrder = query.manufacturingOrder || query.moId;
  }

  if (query.workOrder || query.woId) {
    filter.workOrder = query.workOrder || query.woId;
  }

  if (query.performedBy || query.userId) {
    filter.performedBy = query.performedBy || query.userId;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ reason: searchRegex }, { referenceId: searchRegex }];
  }

  if (query.startDate || query.endDate) {
    filter.movementDate = {};
    if (query.startDate) filter.movementDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.movementDate.$lte = new Date(query.endDate);
  }

  const [entries, total] = await Promise.all([
    StockLedger.find(filter)
      .populate('product', 'name sku category unitOfMeasure stockOnHand')
      .populate('performedBy', 'firstName lastName email role')
      .populate('manufacturingOrder', 'moNumber status finishedProduct')
      .populate('workOrder', 'woNumber operationName')
      .sort({ movementDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StockLedger.countDocuments(filter),
  ]);

  return {
    entries,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get ledger entries for a specific product
 */
export const getProductLedgerEntries = async (productId, query = {}) => {
  return await getStockLedgerEntries({ ...query, productId });
};

/**
 * Get ledger entries for a specific Manufacturing Order
 */
export const getMOLedgerEntries = async (moId, query = {}) => {
  return await getStockLedgerEntries({ ...query, moId });
};

/**
 * Get current stock for a product
 */
export const getCurrentStock = async (productId) => {
  const product = await Product.findById(productId).select('name sku category unitOfMeasure stockOnHand minStockLevel costPrice');
  if (!product) {
    throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  return {
    productId: product._id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    unitOfMeasure: product.unitOfMeasure,
    stockOnHand: product.stockOnHand,
    minStockLevel: product.minStockLevel,
    isLowStock: product.stockOnHand <= product.minStockLevel,
  };
};

/**
 * Batch evaluation of component availability
 */
export const checkStockAvailability = async (components = []) => {
  if (!Array.isArray(components) || components.length === 0) {
    return [];
  }

  const results = await Promise.all(
    components.map(async (item) => {
      const prodId = item.productId || item.product || item._id;
      const reqQty = Number(item.requiredQuantity || item.quantity || 0);

      const product = await Product.findById(prodId).select('name sku unitOfMeasure stockOnHand category');
      if (!product) {
        return {
          productId: prodId,
          productName: 'Unknown Product',
          sku: 'N/A',
          requiredQuantity: reqQty,
          availableQuantity: 0,
          shortage: reqQty,
          status: 'Insufficient',
        };
      }

      const availableQty = product.stockOnHand || 0;
      const shortage = Math.max(0, reqQty - availableQty);

      let status = 'Available';
      if (shortage > 0) {
        status = availableQty > 0 ? 'Partially Available' : 'Insufficient';
      }

      return {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        unitOfMeasure: product.unitOfMeasure || 'pcs',
        requiredQuantity: reqQty,
        availableQuantity: availableQty,
        shortage,
        status,
      };
    })
  );

  return results;
};

export const stockLedgerService = {
  createStockMovement,
  getStockLedgerEntryById,
  consumeRawMaterial,
  addFinishedGoods,
  adjustStock,
  getStockLedgerEntries,
  getProductLedgerEntries,
  getMOLedgerEntries,
  getCurrentStock,
  checkStockAvailability,
};

export default stockLedgerService;
