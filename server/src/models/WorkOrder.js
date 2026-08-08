import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema(
  {
    woNumber: {
      type: String,
      required: [true, 'Please provide a Work Order number'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    manufacturingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ManufacturingOrder',
      required: [true, 'Please provide a Manufacturing Order reference'],
      index: true,
    },
    operationName: {
      type: String,
      required: [true, 'Please provide an operation name'],
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Sequence must be at least 1'],
    },
    workCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
      required: [true, 'Please provide a Work Center reference'],
      index: true,
    },
    plannedDurationMinutes: {
      type: Number,
      required: true,
      default: 60,
      min: [0, 'Planned duration cannot be negative'],
    },
    actualDurationMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Actual duration cannot be negative'],
    },
    plannedStartDate: {
      type: Date,
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
    status: {
      type: String,
      enum: ['pending', 'ready', 'in_progress', 'completed', 'blocked', 'cancelled'],
      default: 'pending',
      index: true,
    },
    assignedOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

workOrderSchema.index({ woNumber: 'text', operationName: 'text', notes: 'text' });
workOrderSchema.index({ manufacturingOrder: 1, sequence: 1 });
workOrderSchema.index({ status: 1, workCenter: 1 });

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

export default WorkOrder;
