import BOM from '../models/BOM.js';
import Product from '../models/Product.js';
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
 * Validate product and work center references for a BOM
 */
const validateBOMReferences = async ({ finishedProduct, components, operations }) => {
  // 1. Verify finished product exists
  const targetProduct = await Product.findById(finishedProduct);
  if (!targetProduct) {
    throw createError('Finished product not found', 404, 'FINISHED_PRODUCT_NOT_FOUND');
  }

  // 2. Verify components list
  if (!Array.isArray(components) || components.length === 0) {
    throw createError('BOM must contain at least one component', 400, 'EMPTY_COMPONENTS');
  }

  const componentProductIds = [];
  for (const comp of components) {
    if (!comp.product) {
      throw createError('Component product reference is required', 400, 'MISSING_COMPONENT_PRODUCT');
    }
    if (typeof comp.quantity !== 'number' || comp.quantity <= 0) {
      throw createError('Component quantity must be greater than 0', 400, 'INVALID_COMPONENT_QUANTITY');
    }

    const compIdStr = comp.product.toString();

    // Prevent self-reference
    if (compIdStr === finishedProduct.toString()) {
      throw createError(
        'A product cannot be listed as its own component in the BOM',
        400,
        'INVALID_SELF_REFERENCE'
      );
    }

    // Prevent duplicate component entries
    if (componentProductIds.includes(compIdStr)) {
      throw createError('Duplicate component product detected in BOM', 400, 'DUPLICATE_COMPONENT_PRODUCT');
    }
    componentProductIds.push(compIdStr);
  }

  // Verify component products exist in database
  const existingCompProducts = await Product.find({ _id: { $in: componentProductIds } });
  if (existingCompProducts.length !== componentProductIds.length) {
    throw createError('One or more component products do not exist', 404, 'COMPONENT_PRODUCT_NOT_FOUND');
  }

  // 3. Verify operations list if provided
  if (Array.isArray(operations) && operations.length > 0) {
    const workCenterIds = operations
      .map((op) => op.workCenter)
      .filter(Boolean)
      .map((id) => id.toString());

    const existingWorkCenters = await WorkCenter.find({ _id: { $in: workCenterIds } });
    if (existingWorkCenters.length !== new Set(workCenterIds).size) {
      throw createError('One or more referenced work centers do not exist', 404, 'WORK_CENTER_NOT_FOUND');
    }
  }

  return targetProduct;
};

/**
 * Create a new Bill of Materials
 */
export const createBOM = async (bomData) => {
  const { code, finishedProduct, quantity, version, components, operations, notes } = bomData;

  if (!code || !finishedProduct) {
    throw createError('BOM code and finished product reference are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  const normalizedCode = code.trim().toUpperCase();
  const existingBOM = await BOM.findOne({ code: normalizedCode });
  if (existingBOM) {
    throw createError(`BOM with code '${normalizedCode}' already exists`, 409, 'DUPLICATE_BOM_CODE');
  }

  await validateBOMReferences({ finishedProduct, components, operations });

  const newBOM = await BOM.create({
    code: normalizedCode,
    finishedProduct,
    quantity: typeof quantity === 'number' && quantity > 0 ? quantity : 1,
    version: version ? version.trim() : '1.0',
    components: components.map((comp) => ({
      product: comp.product,
      quantity: comp.quantity,
      unitOfMeasure: comp.unitOfMeasure || 'pcs',
    })),
    operations: Array.isArray(operations)
      ? operations.map((op, idx) => ({
          sequence: op.sequence || idx + 1,
          name: op.name ? op.name.trim() : `Operation ${idx + 1}`,
          workCenter: op.workCenter,
          durationMinutes: op.durationMinutes || 60,
        }))
      : [],
    notes: notes ? notes.trim() : '',
    isActive: true,
  });

  return await getBOMById(newBOM._id);
};

/**
 * Query BOMs with pagination, search, and filtering
 */
export const getBOMs = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.finishedProduct) {
    filter.finishedProduct = query.finishedProduct;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ code: searchRegex }];
  }

  const [boms, total] = await Promise.all([
    BOM.find(filter)
      .populate('finishedProduct', 'name sku category unitOfMeasure stockOnHand')
      .populate('components.product', 'name sku unitOfMeasure stockOnHand costPrice')
      .populate('operations.workCenter', 'name code costPerHour status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BOM.countDocuments(filter),
  ]);

  return {
    boms,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Fetch single BOM by ID with full population
 */
export const getBOMById = async (bomId) => {
  const bom = await BOM.findById(bomId)
    .populate('finishedProduct', 'name sku category unitOfMeasure stockOnHand costPrice sellingPrice')
    .populate('components.product', 'name sku category unitOfMeasure stockOnHand costPrice')
    .populate('operations.workCenter', 'name code capacityPerHour costPerHour status');

  if (!bom) {
    throw createError('Bill of Materials not found', 404, 'BOM_NOT_FOUND');
  }

  return bom;
};

/**
 * Fetch active BOM for a specific finished product
 */
export const getActiveBOMByProduct = async (productId) => {
  const bom = await BOM.findOne({ finishedProduct: productId, isActive: true })
    .populate('finishedProduct', 'name sku category unitOfMeasure stockOnHand')
    .populate('components.product', 'name sku unitOfMeasure stockOnHand costPrice')
    .populate('operations.workCenter', 'name code capacityPerHour costPerHour status');

  if (!bom) {
    throw createError('No active Bill of Materials found for this product', 404, 'ACTIVE_BOM_NOT_FOUND');
  }

  return bom;
};

/**
 * Update BOM details
 */
export const updateBOM = async (bomId, updateData) => {
  const bom = await BOM.findById(bomId);
  if (!bom) {
    throw createError('Bill of Materials not found', 404, 'BOM_NOT_FOUND');
  }

  if (updateData.code) {
    const normalizedCode = updateData.code.trim().toUpperCase();
    if (normalizedCode !== bom.code) {
      const existing = await BOM.findOne({ code: normalizedCode });
      if (existing) {
        throw createError(`BOM with code '${normalizedCode}' already exists`, 409, 'DUPLICATE_BOM_CODE');
      }
      bom.code = normalizedCode;
    }
  }

  const finishedProduct = updateData.finishedProduct || bom.finishedProduct;
  const components = updateData.components || bom.components;
  const operations = updateData.operations !== undefined ? updateData.operations : bom.operations;

  await validateBOMReferences({ finishedProduct, components, operations });

  if (updateData.finishedProduct) bom.finishedProduct = updateData.finishedProduct;
  if (updateData.quantity !== undefined) bom.quantity = updateData.quantity;
  if (updateData.version !== undefined) bom.version = updateData.version.trim();
  if (updateData.components) {
    bom.components = updateData.components.map((comp) => ({
      product: comp.product,
      quantity: comp.quantity,
      unitOfMeasure: comp.unitOfMeasure || 'pcs',
    }));
  }
  if (updateData.operations) {
    bom.operations = updateData.operations.map((op, idx) => ({
      sequence: op.sequence || idx + 1,
      name: op.name ? op.name.trim() : `Operation ${idx + 1}`,
      workCenter: op.workCenter,
      durationMinutes: op.durationMinutes || 60,
    }));
  }
  if (updateData.notes !== undefined) bom.notes = updateData.notes.trim();
  if (updateData.isActive !== undefined) bom.isActive = Boolean(updateData.isActive);

  await bom.save();

  return await getBOMById(bom._id);
};

/**
 * Toggle active/inactive status of BOM
 */
export const toggleBOMStatus = async (bomId, isActive) => {
  const bom = await BOM.findById(bomId);
  if (!bom) {
    throw createError('Bill of Materials not found', 404, 'BOM_NOT_FOUND');
  }

  bom.isActive = Boolean(isActive);
  await bom.save();

  return await getBOMById(bom._id);
};

/**
 * Delete a BOM
 */
export const deleteBOM = async (bomId) => {
  const bom = await BOM.findById(bomId);
  if (!bom) {
    throw createError('Bill of Materials not found', 404, 'BOM_NOT_FOUND');
  }

  await BOM.findByIdAndDelete(bomId);
  return { id: bomId, message: 'BOM deleted successfully' };
};

/**
 * Calculate dynamic component and operation requirements for a target manufacturing quantity
 */
export const calculateRequirements = async (bomId, manufacturingQuantity) => {
  if (typeof manufacturingQuantity !== 'number' || manufacturingQuantity <= 0) {
    throw createError('Target manufacturing quantity must be a positive number', 400, 'INVALID_MANUFACTURING_QUANTITY');
  }

  const bom = await getBOMById(bomId);
  const baseQuantity = bom.quantity || 1;
  const ratio = manufacturingQuantity / baseQuantity;

  const requiredComponents = bom.components.map((comp) => {
    const prod = comp.product || {};
    const baseQty = comp.quantity;
    const requiredQty = Number((baseQty * ratio).toFixed(4));

    return {
      productId: prod._id || comp.product,
      productName: prod.name || 'Unknown Product',
      productSku: prod.sku || '',
      unitOfMeasure: comp.unitOfMeasure || prod.unitOfMeasure || 'pcs',
      stockOnHand: prod.stockOnHand || 0,
      sufficientStock: (prod.stockOnHand || 0) >= requiredQty,
      baseQuantity: baseQty,
      requiredQuantity: requiredQty,
    };
  });

  const requiredOperations = bom.operations.map((op) => {
    const wc = op.workCenter || {};
    const baseDuration = op.durationMinutes || 60;
    const totalDurationMinutes = Number((baseDuration * ratio).toFixed(2));

    return {
      sequence: op.sequence,
      name: op.name,
      workCenterId: wc._id || op.workCenter,
      workCenterName: wc.name || 'Unknown Work Center',
      workCenterCode: wc.code || '',
      baseDurationMinutes: baseDuration,
      totalDurationMinutes,
    };
  });

  const finishedProd = bom.finishedProduct || {};

  return {
    bomId: bom._id,
    bomCode: bom.code,
    version: bom.version,
    product: {
      id: finishedProd._id || bom.finishedProduct,
      name: finishedProd.name || '',
      sku: finishedProd.sku || '',
      unitOfMeasure: finishedProd.unitOfMeasure || 'pcs',
    },
    baseBOMQuantity: baseQuantity,
    manufacturingQuantity,
    components: requiredComponents,
    operations: requiredOperations,
  };
};

export const bomService = {
  createBOM,
  getBOMs,
  getBOMById,
  getActiveBOMByProduct,
  updateBOM,
  toggleBOMStatus,
  deleteBOM,
  calculateRequirements,
};

export default bomService;
