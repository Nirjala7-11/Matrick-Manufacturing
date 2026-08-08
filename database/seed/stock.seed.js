/**
 * Stock Ledger Seed Data Factory
 * Initial inventory receipts, raw material consumptions, and finished goods production ledger logs.
 */
export const getStockSeedData = (productsBySku, usersByRole, moList) => {
  const adminUser = usersByRole['admin'] || usersByRole['manager'];
  const operatorUser = usersByRole['operator'] || adminUser;

  const inProgressMO = moList.find((mo) => mo.moNumber === 'MO-2026-001') || moList[0];

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    // 1. Initial Purchase Receipts (Stock In)
    {
      product: productsBySku['RM-LEG-101']._id,
      movementType: 'IN',
      quantity: 300,
      unitOfMeasure: 'pcs',
      stockBefore: 0,
      stockAfter: 300,
      referenceType: 'PURCHASE_RECEIPT',
      referenceId: 'PO-2026-088',
      reason: 'Initial warehouse inventory stock receipt from supplier.',
      performedBy: adminUser._id,
      movementDate: twoDaysAgo,
    },
    {
      product: productsBySku['RM-TOP-102']._id,
      movementType: 'IN',
      quantity: 100,
      unitOfMeasure: 'pcs',
      stockBefore: 0,
      stockAfter: 100,
      referenceType: 'PURCHASE_RECEIPT',
      referenceId: 'PO-2026-089',
      reason: 'Teak panel batch delivery.',
      performedBy: adminUser._id,
      movementDate: twoDaysAgo,
    },
    {
      product: productsBySku['FP-TAB-001']._id,
      movementType: 'IN',
      quantity: 15,
      unitOfMeasure: 'pcs',
      stockBefore: 0,
      stockAfter: 15,
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: 'ADJ-2026-001',
      reason: 'Opening stock balance reconciliation.',
      performedBy: adminUser._id,
      movementDate: twoDaysAgo,
    },

    // 2. Material Consumptions for MO-2026-001
    {
      product: productsBySku['RM-LEG-101']._id,
      movementType: 'RAW_MATERIAL_CONSUMPTION',
      quantity: 40,
      unitOfMeasure: 'pcs',
      stockBefore: 300,
      stockAfter: 260,
      referenceType: 'MANUFACTURING_ORDER',
      referenceId: inProgressMO?.moNumber || 'MO-2026-001',
      manufacturingOrder: inProgressMO?._id,
      reason: 'Component issuance to Assembly line for 10 units of Wooden Table.',
      performedBy: operatorUser._id,
      movementDate: yesterday,
    },
    {
      product: productsBySku['RM-TOP-102']._id,
      movementType: 'RAW_MATERIAL_CONSUMPTION',
      quantity: 10,
      unitOfMeasure: 'pcs',
      stockBefore: 100,
      stockAfter: 90,
      referenceType: 'MANUFACTURING_ORDER',
      referenceId: inProgressMO?.moNumber || 'MO-2026-001',
      manufacturingOrder: inProgressMO?._id,
      reason: 'Teak panels issued for MO-2026-001.',
      performedBy: operatorUser._id,
      movementDate: yesterday,
    },

    // 3. Finished Goods Production Output
    {
      product: productsBySku['FP-TAB-001']._id,
      movementType: 'FINISHED_GOODS_PRODUCTION',
      quantity: 10,
      unitOfMeasure: 'pcs',
      stockBefore: 15,
      stockAfter: 25,
      referenceType: 'MANUFACTURING_ORDER',
      referenceId: inProgressMO?.moNumber || 'MO-2026-001',
      manufacturingOrder: inProgressMO?._id,
      reason: 'Completion and warehouse transfer of 10 executive tables.',
      performedBy: operatorUser._id,
      movementDate: now,
    },
  ];
};

export default getStockSeedData;
