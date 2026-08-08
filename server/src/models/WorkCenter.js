import mongoose from 'mongoose';

const workCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a work center name'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide a work center code'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    capacityPerHour: {
      type: Number,
      default: 1,
      min: [0.1, 'Capacity per hour must be at least 0.1'],
    },
    costPerHour: {
      type: Number,
      default: 0,
      min: [0, 'Cost per hour cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true,
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

workCenterSchema.index({ name: 'text', code: 'text' });

const WorkCenter = mongoose.model('WorkCenter', workCenterSchema);

export default WorkCenter;
