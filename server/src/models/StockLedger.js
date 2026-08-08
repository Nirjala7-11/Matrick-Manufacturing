import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    movementType: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'RAW_MATERIAL_CONSUMPTION', 'FINISHED_GOODS_PRODUCTION'],
      required: [true, 'Movement type is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.0001, 'Quantity must be greater than zero'],
    },
    unitOfMeasure: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    stockBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    stockAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    referenceType: {
      type: String,
      enum: ['MANUFACTURING_ORDER', 'WORK_ORDER', 'MANUAL_ADJUSTMENT', 'PURCHASE_RECEIPT', 'OTHER'],
      default: 'OTHER',
    },
    referenceId: {
      type: String,
      trim: true,
    },
    manufacturingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ManufacturingOrder',
      index: true,
    },
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User performing movement is required'],
      index: true,
    },
    movementDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

stockLedgerSchema.index({ product: 1, movementDate: -1 });
stockLedgerSchema.index({ manufacturingOrder: 1, movementDate: -1 });
stockLedgerSchema.index({ workOrder: 1, movementDate: -1 });
stockLedgerSchema.index({ movementType: 1, movementDate: -1 });

const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);

export default StockLedger;
