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
 * Create a new Work Center record
 */
export const createWorkCenter = async (workCenterData) => {
  const { name, code, description, capacityPerHour, costPerHour, status } = workCenterData;

  if (!name || !code) {
    throw createError('Work Center name and code are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  const normalizedCode = code.trim().toUpperCase();
  const existingWorkCenter = await WorkCenter.findOne({ code: normalizedCode });

  if (existingWorkCenter) {
    throw createError(`Work Center with code '${normalizedCode}' already exists`, 409, 'DUPLICATE_WORK_CENTER_CODE');
  }

  const newWorkCenter = await WorkCenter.create({
    name: name.trim(),
    code: normalizedCode,
    description: description ? description.trim() : '',
    capacityPerHour: typeof capacityPerHour === 'number' ? capacityPerHour : 1,
    costPerHour: typeof costPerHour === 'number' ? costPerHour : 0,
    status: status || 'active',
    isActive: status !== 'inactive',
  });

  return newWorkCenter;
};

/**
 * Query Work Centers with pagination, status filter, and search
 */
export const getWorkCenters = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { code: searchRegex }];
  }

  const [workCenters, total] = await Promise.all([
    WorkCenter.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    WorkCenter.countDocuments(filter),
  ]);

  return {
    workCenters,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Fetch Work Center by ID
 */
export const getWorkCenterById = async (workCenterId) => {
  const workCenter = await WorkCenter.findById(workCenterId);
  if (!workCenter) {
    throw createError('Work Center not found', 404, 'WORK_CENTER_NOT_FOUND');
  }
  return workCenter;
};

/**
 * Update Work Center specifications
 */
export const updateWorkCenter = async (workCenterId, updateData) => {
  const workCenter = await WorkCenter.findById(workCenterId);
  if (!workCenter) {
    throw createError('Work Center not found', 404, 'WORK_CENTER_NOT_FOUND');
  }

  if (updateData.code) {
    const normalizedCode = updateData.code.trim().toUpperCase();
    if (normalizedCode !== workCenter.code) {
      const existing = await WorkCenter.findOne({ code: normalizedCode });
      if (existing) {
        throw createError(`Work Center with code '${normalizedCode}' already exists`, 409, 'DUPLICATE_WORK_CENTER_CODE');
      }
      workCenter.code = normalizedCode;
    }
  }

  if (updateData.name !== undefined) workCenter.name = updateData.name.trim();
  if (updateData.description !== undefined) workCenter.description = updateData.description.trim();
  if (updateData.capacityPerHour !== undefined) workCenter.capacityPerHour = updateData.capacityPerHour;
  if (updateData.costPerHour !== undefined) workCenter.costPerHour = updateData.costPerHour;
  if (updateData.status !== undefined) {
    workCenter.status = updateData.status;
    workCenter.isActive = updateData.status !== 'inactive';
  }
  if (updateData.isActive !== undefined) {
    workCenter.isActive = Boolean(updateData.isActive);
    if (!workCenter.isActive) workCenter.status = 'inactive';
  }

  await workCenter.save();
  return workCenter;
};

/**
 * Toggle active/inactive or status of Work Center
 */
export const toggleWorkCenterStatus = async (workCenterId, status) => {
  const workCenter = await WorkCenter.findById(workCenterId);
  if (!workCenter) {
    throw createError('Work Center not found', 404, 'WORK_CENTER_NOT_FOUND');
  }

  if (typeof status === 'boolean') {
    workCenter.isActive = status;
    workCenter.status = status ? 'active' : 'inactive';
  } else if (typeof status === 'string') {
    workCenter.status = status;
    workCenter.isActive = status !== 'inactive';
  }

  await workCenter.save();
  return workCenter;
};

export const workCenterService = {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterStatus,
};

export default workCenterService;
