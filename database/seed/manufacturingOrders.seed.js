/**
 * Manufacturing Orders (MO) Seed Data Factory
 * Creates production runs in different lifecycle statuses (in_progress, confirmed, draft, completed).
 */
export const getMOSeedData = (productsBySku, bomsByCode, usersByRole) => {
  const adminUser = usersByRole['admin'] || usersByRole['manager'];
  const tableProduct = productsBySku['FP-TAB-001'];
  const chairProduct = productsBySku['FP-CHR-002'];
  const tableBOM = bomsByCode['BOM-TAB-001'];
  const chairBOM = bomsByCode['BOM-CHR-002'];

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return [
    // MO 1: In Progress Production Run
    {
      moNumber: 'MO-2026-001',
      finishedProduct: tableProduct._id,
      bom: tableBOM._id,
      quantity: 10,
      unitOfMeasure: 'pcs',
      status: 'in_progress',
      priority: 'high',
      plannedStartDate: yesterday,
      plannedEndDate: tomorrow,
      actualStartDate: yesterday,
      createdBy: adminUser._id,
      notes: 'Priority corporate order for high-grade executive desk batch.',
      componentAvailabilityStatus: 'available',
      componentRequirements: tableBOM.components.map((c) => ({
        product: c.product,
        requiredQuantity: c.quantity * 10,
        unitOfMeasure: c.unitOfMeasure,
        consumedQuantity: c.quantity * 10,
        availableStock: 200,
        sufficientStock: true,
      })),
    },

    // MO 2: Confirmed Production Run (Ready to start)
    {
      moNumber: 'MO-2026-002',
      finishedProduct: chairProduct._id,
      bom: chairBOM._id,
      quantity: 15,
      unitOfMeasure: 'pcs',
      status: 'confirmed',
      priority: 'medium',
      plannedStartDate: now,
      plannedEndDate: nextWeek,
      createdBy: adminUser._id,
      notes: 'Standard replenishment batch for executive office chairs.',
      componentAvailabilityStatus: 'available',
      componentRequirements: chairBOM.components.map((c) => ({
        product: c.product,
        requiredQuantity: c.quantity * 15,
        unitOfMeasure: c.unitOfMeasure,
        consumedQuantity: 0,
        availableStock: 150,
        sufficientStock: true,
      })),
    },

    // MO 3: Draft Production Run (Planning stage)
    {
      moNumber: 'MO-2026-003',
      finishedProduct: tableProduct._id,
      bom: tableBOM._id,
      quantity: 5,
      unitOfMeasure: 'pcs',
      status: 'draft',
      priority: 'low',
      plannedStartDate: tomorrow,
      plannedEndDate: nextWeek,
      createdBy: adminUser._id,
      notes: 'Draft order subject to raw material procurement confirmation.',
      componentAvailabilityStatus: 'available',
      componentRequirements: tableBOM.components.map((c) => ({
        product: c.product,
        requiredQuantity: c.quantity * 5,
        unitOfMeasure: c.unitOfMeasure,
        consumedQuantity: 0,
        availableStock: 100,
        sufficientStock: true,
      })),
    },
  ];
};

export default getMOSeedData;
