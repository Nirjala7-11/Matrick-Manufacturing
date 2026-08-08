import mongoose from 'mongoose';

const moComponentRequirementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Component product reference is required'],
    },
    requiredQuantity: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [0, 'Required quantity cannot be negative'],
    },
    unitOfMeasure: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    consumedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Consumed quantity cannot be negative'],
    },
    availableStock: {
      type: Number,
      default: 0,
    },
    sufficientStock: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const manufacturingOrderSchema = new mongoose.Schema(
  {
    moNumber: {
      type: String,
      required: [true, 'Please provide an MO number'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    finishedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please provide a finished product reference'],
      index: true,
    },
    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      required: [true, 'Please provide a BOM reference'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide manufacturing quantity'],
      min: [0.0001, 'Quantity must be greater than 0'],
      default: 1,
    },
    unitOfMeasure: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    plannedStartDate: {
      type: Date,
      default: Date.now,
    },
    plannedEndDate: {
      type: Date,
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    componentRequirements: {
      type: [moComponentRequirementSchema],
      default: [],
    },
    componentAvailabilityStatus: {
      type: String,
      enum: ['available', 'insufficient', 'partially_available'],
      default: 'insufficient',
    },
  },
  {
    timestamps: true,
  }
);

manufacturingOrderSchema.index({ moNumber: 'text', notes: 'text' });
manufacturingOrderSchema.index({ status: 1, createdAt: -1 });

const ManufacturingOrder = mongoose.model('ManufacturingOrder', manufacturingOrderSchema);

export default ManufacturingOrder;
