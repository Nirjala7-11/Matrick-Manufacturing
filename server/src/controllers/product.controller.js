import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import productService from '../services/product.service.js';

/**
 * Create a new product.
 * POST /api/products
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku } = req.body;

  if (!name || !sku) {
    return sendError(res, 'Product name and SKU are required', 'MISSING_FIELDS', 400);
  }

  const product = await productService.createProduct(req.body);
  return sendSuccess(res, 'Product created successfully', product, 201);
});

/**
 * Get all products with filtering, searching, and pagination.
 * GET /api/products
 */
export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  return sendSuccess(res, 'Products retrieved successfully', result.products, 200, result.meta);
});

/**
 * Get product by ID.
 * GET /api/products/:id
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return sendSuccess(res, 'Product retrieved successfully', product, 200);
});

/**
 * Update product details.
 * PUT /api/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await productService.updateProduct(req.params.id, req.body);
  return sendSuccess(res, 'Product updated successfully', updatedProduct, 200);
});

/**
 * Toggle product active status.
 * PATCH /api/products/:id/status
 */
export const toggleProductStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) {
    return sendError(res, 'isActive boolean field is required', 'MISSING_FIELDS', 400);
  }

  const updatedProduct = await productService.toggleProductStatus(req.params.id, isActive);
  return sendSuccess(res, 'Product status updated successfully', updatedProduct, 200);
});

export const productController = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
};

export default productController;
