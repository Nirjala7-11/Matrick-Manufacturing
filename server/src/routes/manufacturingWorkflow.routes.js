import express from 'express';
import {
  confirmManufacturingOrder,
  generateWorkOrders,
  startManufacturingOrder,
  consumeComponents,
  produceFinishedGoods,
  completeManufacturingOrder,
  getManufacturingExecutionStatus,
} from '../controllers/manufacturingWorkflow.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All workflow endpoints require authentication
router.use(protect);

// GET /api/manufacturing-workflow/:moId/status - Execution dashboard status
router.get('/:moId/status', getManufacturingExecutionStatus);

// POST /api/manufacturing-workflow/:moId/confirm - Confirm MO (admin, manager)
router.post('/:moId/confirm', requireRole('admin', 'manager'), confirmManufacturingOrder);

// POST /api/manufacturing-workflow/:moId/generate-work-orders - Generate WOs from BOM (admin, manager)
router.post('/:moId/generate-work-orders', requireRole('admin', 'manager'), generateWorkOrders);

// POST /api/manufacturing-workflow/:moId/start - Start MO execution (admin, manager, operator)
router.post('/:moId/start', requireRole('admin', 'manager', 'operator'), startManufacturingOrder);

// POST /api/manufacturing-workflow/:moId/consume-components - Consume required raw material components (admin, manager, operator)
router.post('/:moId/consume-components', requireRole('admin', 'manager', 'operator'), consumeComponents);

// POST /api/manufacturing-workflow/:moId/produce - Record finished goods production output (admin, manager, operator)
router.post('/:moId/produce', requireRole('admin', 'manager', 'operator'), produceFinishedGoods);

// POST /api/manufacturing-workflow/:moId/complete - Complete MO (admin, manager, operator)
router.post('/:moId/complete', requireRole('admin', 'manager', 'operator'), completeManufacturingOrder);

export default router;
