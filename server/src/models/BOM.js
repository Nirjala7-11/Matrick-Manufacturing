import mongoose from 'mongoose';

const bomComponentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Component product reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Component quantity is required'],
      min: [0.0001, 'Component quantity must be greater than 0'],
    },
    unitOfMeasure: {
      type: String,
      trim: true,
      default: 'pcs',
    },
  },
  { _id: true }
);

const bomOperationSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Sequence must be at least 1'],
    },
    name: {
      type: String,
      required: [true, 'Operation name is required'],
      trim: true,
    },
    workCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
      required: [true, 'Operation work center reference is required'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
      min: [1, 'Duration in minutes must be at least 1'],
    },
  },
  { _id: true }
);

const bomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a BOM code/identifier'],
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
    quantity: {
      type: Number,
      required: [true, 'BOM base output quantity is required'],
      default: 1,
      min: [0.0001, 'BOM output quantity must be greater than 0'],
    },
    version: {
      type: String,
      trim: true,
      default: '1.0',
    },
    components: {
      type: [bomComponentSchema],
      validate: [
        function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        'A Bill of Materials must contain at least one component',
      ],
    },
    operations: {
      type: [bomOperationSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

bomSchema.index({ finishedProduct: 1, isActive: 1 });
bomSchema.index({ code: 'text' });

const BOM = mongoose.model('BOM', bomSchema);

export default BOM;
