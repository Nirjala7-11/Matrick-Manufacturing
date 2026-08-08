import express from 'express';
import {
  createMO,
  getMOs,
  getMOById,
  updateMO,
  confirmMO,
  startMO,
  completeMO,
  cancelMO,
  checkComponentAvailability,
} from '../controllers/manufacturingOrder.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All Manufacturing Order routes require authentication
router.use(protect);

// GET /api/manufacturing-orders - List MOs
router.get('/', getMOs);

// GET /api/manufacturing-orders/:id/availability - Check live component availability
router.get('/:id/availability', checkComponentAvailability);

// GET /api/manufacturing-orders/:id - Get single MO
router.get('/:id', getMOById);

// POST /api/manufacturing-orders - Create MO (admin, manager)
router.post('/', requireRole('admin', 'manager'), createMO);

// PUT /api/manufacturing-orders/:id - Update MO planning fields/quantity (admin, manager)
router.put('/:id', requireRole('admin', 'manager'), updateMO);

// POST /api/manufacturing-orders/:id/confirm - Confirm MO (admin, manager)
router.post('/:id/confirm', requireRole('admin', 'manager'), confirmMO);

// POST /api/manufacturing-orders/:id/start - Start MO (admin, manager, operator)
router.post('/:id/start', requireRole('admin', 'manager', 'operator'), startMO);

// POST /api/manufacturing-orders/:id/complete - Complete MO (admin, manager, operator)
router.post('/:id/complete', requireRole('admin', 'manager', 'operator'), completeMO);

// POST /api/manufacturing-orders/:id/cancel - Cancel MO (admin, manager)
router.post('/:id/cancel', requireRole('admin', 'manager'), cancelMO);

export default router;
