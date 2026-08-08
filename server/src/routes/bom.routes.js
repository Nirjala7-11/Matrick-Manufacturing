import express from 'express';
import {
  createBOM,
  getBOMs,
  getBOMById,
  getBOMByProduct,
  updateBOM,
  toggleBOMStatus,
  deleteBOM,
  calculateRequirements,
} from '../controllers/bom.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All BOM routes require authentication
router.use(protect);

// GET /api/boms - Read BOMs list (all authenticated roles)
router.get('/', getBOMs);

// GET /api/boms/product/:productId - Get active BOM by finished product ID
router.get('/product/:productId', getBOMByProduct);

// GET /api/boms/:id - Read single BOM
router.get('/:id', getBOMById);

// POST /api/boms/:id/calculate-requirements - Calculate component requirements for a given quantity
router.post('/:id/calculate-requirements', calculateRequirements);

// POST /api/boms - Create BOM (admin, manager)
router.post('/', requireRole('admin', 'manager'), createBOM);

// PUT /api/boms/:id - Update BOM (admin, manager)
router.put('/:id', requireRole('admin', 'manager'), updateBOM);

// PATCH /api/boms/:id/status - Toggle active status (admin, manager)
router.patch('/:id/status', requireRole('admin', 'manager'), toggleBOMStatus);

// DELETE /api/boms/:id - Delete BOM (admin, manager)
router.delete('/:id', requireRole('admin', 'manager'), deleteBOM);

export default router;
