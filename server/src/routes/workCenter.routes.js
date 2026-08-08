import express from 'express';
import {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterStatus,
} from '../controllers/workCenter.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All work center routes require authentication
router.use(protect);

// GET /api/work-centers - Read work centers (accessible to all authenticated roles)
router.get('/', getWorkCenters);

// GET /api/work-centers/:id - Read single work center
router.get('/:id', getWorkCenterById);

// POST /api/work-centers - Create work center (admin, manager)
router.post('/', requireRole('admin', 'manager'), createWorkCenter);

// PUT /api/work-centers/:id - Update work center (admin, manager)
router.put('/:id', requireRole('admin', 'manager'), updateWorkCenter);

// PATCH /api/work-centers/:id/status - Toggle status (admin, manager)
router.patch('/:id/status', requireRole('admin', 'manager'), toggleWorkCenterStatus);

export default router;
