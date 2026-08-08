import Product from '../models/Product.js';

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
 * Create a new Product record
 */
export const createProduct = async (productData) => {
  const { name, sku, category, unitOfMeasure, minStockLevel, costPrice, sellingPrice, description, stockOnHand } =
    productData;

  if (!name || !sku) {
    throw createError('Product name and SKU/code are required', 400, 'MISSING_REQUIRED_FIELDS');
  }

  const normalizedSku = sku.trim().toUpperCase();
  const existingProduct = await Product.findOne({ sku: normalizedSku });

  if (existingProduct) {
    throw createError(`Product with SKU '${normalizedSku}' already exists`, 409, 'DUPLICATE_SKU');
  }

  const newProduct = await Product.create({
    name: name.trim(),
    sku: normalizedSku,
    category: category || 'raw_material',
    unitOfMeasure: unitOfMeasure || 'pcs',
    stockOnHand: typeof stockOnHand === 'number' ? stockOnHand : 0,
    minStockLevel: typeof minStockLevel === 'number' ? minStockLevel : 0,
    costPrice: typeof costPrice === 'number' ? costPrice : 0,
    sellingPrice: typeof sellingPrice === 'number' ? sellingPrice : 0,
    description: description ? description.trim() : '',
    isActive: true,
  });

  return newProduct;
};

/**
 * Query products with pagination, search, and category filtering
 */
export const getProducts = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { sku: searchRegex }];
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Fetch product by Mongoose ObjectId
 */
export const getProductById = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  return product;
};

/**
 * Update product specifications (excluding arbitrary stockOnHand changes)
 */
export const updateProduct = async (productId, updateData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (updateData.sku) {
    const normalizedSku = updateData.sku.trim().toUpperCase();
    if (normalizedSku !== product.sku) {
      const existing = await Product.findOne({ sku: normalizedSku });
      if (existing) {
        throw createError(`Product with SKU '${normalizedSku}' already exists`, 409, 'DUPLICATE_SKU');
      }
      product.sku = normalizedSku;
    }
  }

  if (updateData.name !== undefined) product.name = updateData.name.trim();
  if (updateData.category !== undefined) product.category = updateData.category;
  if (updateData.unitOfMeasure !== undefined) product.unitOfMeasure = updateData.unitOfMeasure.trim();
  if (updateData.minStockLevel !== undefined) product.minStockLevel = updateData.minStockLevel;
  if (updateData.costPrice !== undefined) product.costPrice = updateData.costPrice;
  if (updateData.sellingPrice !== undefined) product.sellingPrice = updateData.sellingPrice;
  if (updateData.description !== undefined) product.description = updateData.description.trim();
  if (updateData.isActive !== undefined) product.isActive = Boolean(updateData.isActive);

  await product.save();
  return product;
};

/**
 * Toggle active/inactive status of product
 */
export const toggleProductStatus = async (productId, isActive) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  product.isActive = Boolean(isActive);
  await product.save();
  return product;
};

export const productService = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
};

export default productService;
