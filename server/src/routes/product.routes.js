import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
} from '../controllers/product.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All product routes require authentication
router.use(protect);

// GET /api/products - Read products (accessible to all authenticated roles)
router.get('/', getProducts);

// GET /api/products/:id - Read single product
router.get('/:id', getProductById);

// POST /api/products - Create product (admin, manager)
router.post('/', requireRole('admin', 'manager'), createProduct);

// PUT /api/products/:id - Update product (admin, manager)
router.put('/:id', requireRole('admin', 'manager'), updateProduct);

// PATCH /api/products/:id/status - Toggle active status (admin, manager)
router.patch('/:id/status', requireRole('admin', 'manager'), toggleProductStatus);

export default router;
