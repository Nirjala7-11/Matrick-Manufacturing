import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import workCenterService from '../services/workCenter.service.js';

/**
 * Create a new Work Center.
 * POST /api/work-centers
 */
export const createWorkCenter = asyncHandler(async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return sendError(res, 'Work Center name and code are required', 'MISSING_FIELDS', 400);
  }

  const workCenter = await workCenterService.createWorkCenter(req.body);
  return sendSuccess(res, 'Work Center created successfully', workCenter, 201);
});

/**
 * Get all Work Centers with filtering, searching, and pagination.
 * GET /api/work-centers
 */
export const getWorkCenters = asyncHandler(async (req, res) => {
  const result = await workCenterService.getWorkCenters(req.query);
  return sendSuccess(res, 'Work Centers retrieved successfully', result.workCenters, 200, result.meta);
});

/**
 * Get Work Center by ID.
 * GET /api/work-centers/:id
 */
export const getWorkCenterById = asyncHandler(async (req, res) => {
  const workCenter = await workCenterService.getWorkCenterById(req.params.id);
  return sendSuccess(res, 'Work Center retrieved successfully', workCenter, 200);
});

/**
 * Update Work Center details.
 * PUT /api/work-centers/:id
 */
export const updateWorkCenter = asyncHandler(async (req, res) => {
  const updatedWorkCenter = await workCenterService.updateWorkCenter(req.params.id, req.body);
  return sendSuccess(res, 'Work Center updated successfully', updatedWorkCenter, 200);
});

/**
 * Toggle Work Center status.
 * PATCH /api/work-centers/:id/status
 */
export const toggleWorkCenterStatus = asyncHandler(async (req, res) => {
  const { status, isActive } = req.body;
  const statusPayload = status !== undefined ? status : isActive;

  if (statusPayload === undefined) {
    return sendError(res, 'status or isActive field is required', 'MISSING_FIELDS', 400);
  }

  const updatedWorkCenter = await workCenterService.toggleWorkCenterStatus(req.params.id, statusPayload);
  return sendSuccess(res, 'Work Center status updated successfully', updatedWorkCenter, 200);
});

export const workCenterController = {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterStatus,
};

export default workCenterController;
