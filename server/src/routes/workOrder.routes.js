import express from 'express';
import {
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
} from '../controllers/workOrder.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All Work Order routes require authentication
router.use(protect);

// GET /api/work-orders - List Work Orders
router.get('/', getWorkOrders);

// GET /api/work-orders/manufacturing-order/:moId - Get WOs for specific MO
router.get('/manufacturing-order/:moId', getWorkOrdersByMO);

// GET /api/work-orders/work-center/:workCenterId - Get WOs for specific Work Center
router.get('/work-center/:workCenterId', getWorkOrdersByWorkCenter);

// GET /api/work-orders/:id - Get single Work Order
router.get('/:id', getWorkOrderById);

// POST /api/work-orders/generate/:moId - Generate WOs from MO's BOM operations (admin, manager)
router.post('/generate/:moId', requireRole('admin', 'manager'), generateWorkOrdersForMO);

// POST /api/work-orders - Create custom Work Order manually (admin, manager)
router.post('/', requireRole('admin', 'manager'), createWorkOrder);

// PUT /api/work-orders/:id - Update planning details (admin, manager)
router.put('/:id', requireRole('admin', 'manager'), updateWorkOrder);

// POST /api/work-orders/:id/start - Start execution (admin, manager, operator)
router.post('/:id/start', requireRole('admin', 'manager', 'operator'), startWorkOrder);

// POST /api/work-orders/:id/block - Mark blocked (admin, manager, operator)
router.post('/:id/block', requireRole('admin', 'manager', 'operator'), blockWorkOrder);

// POST /api/work-orders/:id/complete - Complete operation (admin, manager, operator)
router.post('/:id/complete', requireRole('admin', 'manager', 'operator'), completeWorkOrder);

// POST /api/work-orders/:id/cancel - Cancel Work Order (admin, manager)
router.post('/:id/cancel', requireRole('admin', 'manager'), cancelWorkOrder);

export default router;
