import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import analyticsService from '../services/analytics.service.js';

/**
 * Get Manufacturing High-Level Overview & KPIs
 * GET /api/analytics/overview
 */
export const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.query);
  return sendSuccess(res, 'Manufacturing overview retrieved successfully', data, 200);
});

/**
 * Get Production Throughput Analytics
 * GET /api/analytics/throughput
 */
export const getThroughput = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProductionThroughput(req.query);
  return sendSuccess(res, 'Production throughput analytics retrieved successfully', data, 200);
});

/**
 * Get Manufacturing Order Delay Analytics
 * GET /api/analytics/order-delays
 */
export const getOrderDelays = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOrderDelays(req.query);
  return sendSuccess(res, 'Order delay analytics retrieved successfully', data, 200);
});

/**
 * Get Work Center Resource Utilization Analytics
 * GET /api/analytics/resource-utilization
 */
export const getResourceUtilization = asyncHandler(async (req, res) => {
  const data = await analyticsService.getResourceUtilization(req.query);
  return sendSuccess(res, 'Resource utilization analytics retrieved successfully', data, 200);
});

export const analyticsController = {
  getOverview,
  getThroughput,
  getOrderDelays,
  getResourceUtilization,
};

export default analyticsController;
