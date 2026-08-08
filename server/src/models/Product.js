import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide a product SKU/code'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['raw_material', 'finished_goods', 'component', 'assembly'],
      default: 'raw_material',
      index: true,
    },
    unitOfMeasure: {
      type: String,
      required: [true, 'Please provide a unit of measure (e.g., kg, unit, pcs, meter)'],
      trim: true,
      default: 'pcs',
    },
    stockOnHand: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock on hand cannot be negative'],
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: [0, 'Minimum stock level cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast searching across name and SKU
productSchema.index({ name: 'text', sku: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
