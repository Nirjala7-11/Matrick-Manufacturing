import express from 'express';
import {
  getOverview,
  getThroughput,
  getOrderDelays,
  getResourceUtilization,
} from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// GET /api/analytics/overview - Manufacturing KPIs & overview summary
router.get('/overview', getOverview);

// GET /api/analytics/throughput - Production throughput & trends
router.get('/throughput', getThroughput);

// GET /api/analytics/order-delays - Order delay metrics & analysis
router.get('/order-delays', getOrderDelays);

// GET /api/analytics/resource-utilization - Work center utilization metrics
router.get('/resource-utilization', getResourceUtilization);

export default router;
