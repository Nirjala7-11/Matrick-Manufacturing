import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import bomService from '../services/bom.service.js';

/**
 * Create a new Bill of Materials.
 * POST /api/boms
 */
export const createBOM = asyncHandler(async (req, res) => {
  const { code, finishedProduct, components } = req.body;

  if (!code || !finishedProduct || !components) {
    return sendError(res, 'BOM code, finished product, and components are required', 'MISSING_FIELDS', 400);
  }

  const bom = await bomService.createBOM(req.body);
  return sendSuccess(res, 'Bill of Materials created successfully', bom, 201);
});

/**
 * Get all BOMs with filtering, searching, and pagination.
 * GET /api/boms
 */
export const getBOMs = asyncHandler(async (req, res) => {
  const result = await bomService.getBOMs(req.query);
  return sendSuccess(res, 'BOMs retrieved successfully', result.boms, 200, result.meta);
});

/**
 * Get BOM by ID.
 * GET /api/boms/:id
 */
export const getBOMById = asyncHandler(async (req, res) => {
  const bom = await bomService.getBOMById(req.params.id);
  return sendSuccess(res, 'BOM retrieved successfully', bom, 200);
});

/**
 * Get active BOM for a specific product.
 * GET /api/boms/product/:productId
 */
export const getBOMByProduct = asyncHandler(async (req, res) => {
  const bom = await bomService.getActiveBOMByProduct(req.params.productId);
  return sendSuccess(res, 'Active BOM for product retrieved successfully', bom, 200);
});

/**
 * Update BOM details.
 * PUT /api/boms/:id
 */
export const updateBOM = asyncHandler(async (req, res) => {
  const updatedBOM = await bomService.updateBOM(req.params.id, req.body);
  return sendSuccess(res, 'BOM updated successfully', updatedBOM, 200);
});

/**
 * Toggle BOM active status.
 * PATCH /api/boms/:id/status
 */
export const toggleBOMStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) {
    return sendError(res, 'isActive boolean field is required', 'MISSING_FIELDS', 400);
  }

  const updatedBOM = await bomService.toggleBOMStatus(req.params.id, isActive);
  return sendSuccess(res, 'BOM status updated successfully', updatedBOM, 200);
});

/**
 * Delete a BOM.
 * DELETE /api/boms/:id
 */
export const deleteBOM = asyncHandler(async (req, res) => {
  const result = await bomService.deleteBOM(req.params.id);
  return sendSuccess(res, result.message, { id: result.id }, 200);
});

/**
 * Calculate dynamic component and operation requirements for a given manufacturing quantity.
 * POST /api/boms/:id/calculate-requirements
 */
export const calculateRequirements = asyncHandler(async (req, res) => {
  const quantityInput = req.body.quantity !== undefined ? req.body.quantity : req.query.quantity;
  const quantity = Number(quantityInput);

  if (isNaN(quantity) || quantity <= 0) {
    return sendError(res, 'A positive numerical manufacturing quantity is required', 'INVALID_QUANTITY', 400);
  }

  const requirements = await bomService.calculateRequirements(req.params.id, quantity);
  return sendSuccess(res, 'Component requirements calculated successfully', requirements, 200);
});

export const bomController = {
  createBOM,
  getBOMs,
  getBOMById,
  getBOMByProduct,
  updateBOM,
  toggleBOMStatus,
  deleteBOM,
  calculateRequirements,
};

export default bomController;
