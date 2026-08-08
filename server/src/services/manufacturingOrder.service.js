import ManufacturingOrder from '../models/ManufacturingOrder.js';
import Product from '../models/Product.js';
import BOM from '../models/BOM.js';
import bomService from './bom.service.js';

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
 * Generate unique MO number format: MO-YYYYMMDD-XXXX
 */
const generateMONumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await ManufacturingOrder.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  });
  const seq = String(countToday + 1).padStart(4, '0');
  const candidate = `MO-${dateStr}-${seq}`;

  const exists = await ManufacturingOrder.findOne({ moNumber: candidate });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `MO-${dateStr}-${randomSuffix}`;
  }
  return candidate;
};

/**
 * Helper: Evaluate live stock availability for component requirements snapshot
 */
const evaluateComponentAvailability = async (componentsSnapshot) => {
  let allAvailable = true;
  let anyAvailable = false;

  const updatedComponents = await Promise.all(
    componentsSnapshot.map(async (comp) => {
      const prodId = comp.product?._id || comp.product || comp.productId;
      const productDoc = await Product.findById(prodId);

      const stockOnHand = productDoc ? productDoc.stockOnHand || 0 : 0;
      const reqQty = comp.requiredQuantity || 0;
      const isSufficient = stockOnHand >= reqQty;

      if (isSufficient) {
        anyAvailable = true;
      } else {
        allAvailable = false;
        if (stockOnHand > 0) anyAvailable = true;
      }

      return {
        product: prodId,
        requiredQuantity: reqQty,
        unitOfMeasure: comp.unitOfMeasure || productDoc?.unitOfMeasure || 'pcs',
        consumedQuantity: comp.consumedQuantity || 0,
        availableStock: stockOnHand,
        sufficientStock: isSufficient,
      };
    })
  );

  let availabilityStatus = 'insufficient';
  if (allAvailable) {
    availabilityStatus = 'available';
  } else if (anyAvailable) {
    availabilityStatus = 'partially_available';
  }

  return {
    components: updatedComponents,
    availabilityStatus,
  };
};

/**
 * Create a new Manufacturing Order
 */
export const createMO = async (moData, userId) => {
  const { finishedProduct, bom: bomIdInput, quantity, priority, plannedStartDate, plannedEndDate, notes } = moData;

  if (!finishedProduct) {
    throw createError('Finished product reference is required', 400, 'MISSING_FINISHED_PRODUCT');
  }

  const numQuantity = Number(quantity);
  if (isNaN(numQuantity) || numQuantity <= 0) {
    throw createError('Manufacturing quantity must be a positive number', 400, 'INVALID_QUANTITY');
  }

  const targetProduct = await Product.findById(finishedProduct);
  if (!targetProduct) {
    throw createError('Finished product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Resolve BOM
  let targetBOM;
  if (bomIdInput) {
    targetBOM = await BOM.findById(bomIdInput);
    if (!targetBOM) {
      throw createError('Specified Bill of Materials not found', 404, 'BOM_NOT_FOUND');
    }
    if (targetBOM.finishedProduct.toString() !== finishedProduct.toString()) {
      throw createError(
        'Selected BOM does not belong to the specified finished product',
        400,
        'BOM_PRODUCT_MISMATCH'
      );
    }
  } else {
    targetBOM = await bomService.getActiveBOMByProduct(finishedProduct);
  }

  if (!targetBOM.isActive) {
    throw createError('The selected Bill of Materials is inactive', 400, 'INACTIVE_BOM');
  }

  // Calculate component requirements using BOM service
  const calculatedReqs = await bomService.calculateRequirements(targetBOM._id, numQuantity);

  // Evaluate live availability
  const { components: evaluatedComponents, availabilityStatus } = await evaluateComponentAvailability(
    calculatedReqs.components
  );

  // Generate unique MO number if not explicitly passed
  let finalMONumber = moData.moNumber ? moData.moNumber.trim().toUpperCase() : await generateMONumber();

  if (moData.moNumber) {
    const existing = await ManufacturingOrder.findOne({ moNumber: finalMONumber });
    if (existing) {
      throw createError(`Manufacturing Order with number '${finalMONumber}' already exists`, 409, 'DUPLICATE_MO_NUMBER');
    }
  }

  const newMO = await ManufacturingOrder.create({
    moNumber: finalMONumber,
    finishedProduct,
    bom: targetBOM._id,
    quantity: numQuantity,
    unitOfMeasure: targetProduct.unitOfMeasure || 'pcs',
    status: 'draft',
    priority: priority || 'medium',
    plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : new Date(),
    plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : undefined,
    createdBy: userId,
    notes: notes ? notes.trim() : '',
    componentRequirements: evaluatedComponents,
    componentAvailabilityStatus: availabilityStatus,
  });

  return await getMOById(newMO._id);
};

/**
 * Query Manufacturing Orders with pagination, status filters, search, and date filters
 */
export const getMOs = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.finishedProduct) {
    filter.finishedProduct = query.finishedProduct;
  }

  if (query.componentAvailabilityStatus) {
    filter.componentAvailabilityStatus = query.componentAvailabilityStatus;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ moNumber: searchRegex }, { notes: searchRegex }];
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const [orders, total] = await Promise.all([
    ManufacturingOrder.find(filter)
      .populate('finishedProduct', 'name sku category unitOfMeasure stockOnHand')
      .populate('bom', 'code version quantity')
      .populate('createdBy', 'firstName lastName email role')
      .populate('componentRequirements.product', 'name sku unitOfMeasure stockOnHand')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ManufacturingOrder.countDocuments(filter),
  ]);

  return {
    orders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get MO by ID with full population
 */
export const getMOById = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId)
    .populate('finishedProduct', 'name sku category unitOfMeasure stockOnHand costPrice')
    .populate('bom', 'code version quantity components operations')
    .populate('createdBy', 'firstName lastName email role')
    .populate('componentRequirements.product', 'name sku category unitOfMeasure stockOnHand costPrice');

  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  return mo;
};

/**
 * Update planning fields or quantity of a Draft or Confirmed MO
 */
export const updateMO = async (moId, updateData) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(mo.status)) {
    throw createError(
      `Cannot update a Manufacturing Order in '${mo.status}' status`,
      400,
      'INVALID_STATUS_FOR_UPDATE'
    );
  }

  if (updateData.priority !== undefined) mo.priority = updateData.priority;
  if (updateData.plannedStartDate) mo.plannedStartDate = new Date(updateData.plannedStartDate);
  if (updateData.plannedEndDate) mo.plannedEndDate = new Date(updateData.plannedEndDate);
  if (updateData.notes !== undefined) mo.notes = updateData.notes.trim();

  // If quantity changed, recalculate component requirements snapshot
  if (updateData.quantity !== undefined && Number(updateData.quantity) !== mo.quantity) {
    const numQty = Number(updateData.quantity);
    if (isNaN(numQty) || numQty <= 0) {
      throw createError('Manufacturing quantity must be a positive number', 400, 'INVALID_QUANTITY');
    }

    mo.quantity = numQty;
    const calculatedReqs = await bomService.calculateRequirements(mo.bom, numQty);
    const { components, availabilityStatus } = await evaluateComponentAvailability(calculatedReqs.components);

    mo.componentRequirements = components;
    mo.componentAvailabilityStatus = availabilityStatus;
  }

  await mo.save();
  return await getMOById(mo._id);
};

/**
 * Confirm a Draft Manufacturing Order
 */
export const confirmMO = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status !== 'draft') {
    throw createError(
      `Only 'draft' Manufacturing Orders can be confirmed. Current status: '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Recheck component availability
  const { components, availabilityStatus } = await evaluateComponentAvailability(mo.componentRequirements);
  mo.componentRequirements = components;
  mo.componentAvailabilityStatus = availabilityStatus;
  mo.status = 'confirmed';

  await mo.save();
  return await getMOById(mo._id);
};

/**
 * Start execution of a Confirmed Manufacturing Order
 */
export const startMO = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status !== 'confirmed') {
    throw createError(
      `Only 'confirmed' Manufacturing Orders can be started. Current status: '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Recheck component availability
  const { components, availabilityStatus } = await evaluateComponentAvailability(mo.componentRequirements);
  mo.componentRequirements = components;
  mo.componentAvailabilityStatus = availabilityStatus;
  mo.status = 'in_progress';
  mo.actualStartDate = new Date();

  await mo.save();
  return await getMOById(mo._id);
};

/**
 * Complete a Manufacturing Order that is In Progress
 */
export const completeMO = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (mo.status !== 'in_progress') {
    throw createError(
      `Only 'in_progress' Manufacturing Orders can be marked completed. Current status: '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  mo.status = 'completed';
  mo.actualEndDate = new Date();

  await mo.save();
  return await getMOById(mo._id);
};

/**
 * Cancel a Manufacturing Order
 */
export const cancelMO = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  if (['completed', 'cancelled'].includes(mo.status)) {
    throw createError(
      `Cannot cancel a Manufacturing Order that is already '${mo.status}'`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  mo.status = 'cancelled';
  await mo.save();
  return await getMOById(mo._id);
};

/**
 * Perform live component availability check for an MO
 */
export const checkComponentAvailability = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) {
    throw createError('Manufacturing Order not found', 404, 'MO_NOT_FOUND');
  }

  const { components, availabilityStatus } = await evaluateComponentAvailability(mo.componentRequirements);

  mo.componentRequirements = components;
  mo.componentAvailabilityStatus = availabilityStatus;
  await mo.save();

  const refreshedMO = await getMOById(moId);

  return {
    moId: refreshedMO._id,
    moNumber: refreshedMO.moNumber,
    status: refreshedMO.status,
    componentAvailabilityStatus: refreshedMO.componentAvailabilityStatus,
    components: refreshedMO.componentRequirements,
  };
};

export const manufacturingOrderService = {
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

export default manufacturingOrderService;
