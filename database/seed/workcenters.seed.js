/**
 * Work Center Seed Data
 * Shop floor equipment, assembly bays, and operational lines.
 */
export const workCentersSeed = [
  {
    name: 'Carpentry & Cutting Station',
    code: 'WC-CUT-01',
    description: 'Precision CNC wood sawing and automated joinery center.',
    capacityPerHour: 3.5,
    costPerHour: 45.00,
    status: 'active',
    isActive: true,
  },
  {
    name: 'Main Furniture Assembly Line',
    code: 'WC-ASM-02',
    description: 'Pneumatic clamping station for structural frame assembly.',
    capacityPerHour: 2.0,
    costPerHour: 50.00,
    status: 'active',
    isActive: true,
  },
  {
    name: 'Sanding & Painting Bay',
    code: 'WC-PNT-03',
    description: 'Dust-free spray booth with climate-controlled curing lamps.',
    capacityPerHour: 1.8,
    costPerHour: 40.00,
    status: 'active',
    isActive: true,
  },
  {
    name: 'Quality Inspection & Packaging Station',
    code: 'WC-PKG-04',
    description: 'Final dimensional audit, protective wrap, and boxing line.',
    capacityPerHour: 5.0,
    costPerHour: 30.00,
    status: 'active',
    isActive: true,
  },
];

export default workCentersSeed;
