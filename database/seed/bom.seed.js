/**
 * Bill of Materials (BOM) Seed Data Factory
 * Generates multi-level BOM structures linking finished goods to components and operations.
 */
export const getBOMSeedData = (productsBySku, workCentersByCode) => {
  const tableProduct = productsBySku['FP-TAB-001'];
  const chairProduct = productsBySku['FP-CHR-002'];

  return [
    // BOM 1: Wooden Executive Table
    {
      code: 'BOM-TAB-001',
      finishedProduct: tableProduct._id,
      quantity: 1,
      version: '1.0',
      isActive: true,
      notes: 'Standard manufacturing BOM for solid oak executive table.',
      components: [
        {
          product: productsBySku['RM-LEG-101']._id,
          quantity: 4,
          unitOfMeasure: 'pcs',
        },
        {
          product: productsBySku['RM-TOP-102']._id,
          quantity: 1,
          unitOfMeasure: 'pcs',
        },
        {
          product: productsBySku['CM-SCR-103']._id,
          quantity: 1,
          unitOfMeasure: 'box',
        },
        {
          product: productsBySku['RM-VAR-104']._id,
          quantity: 0.5,
          unitOfMeasure: 'liter',
        },
      ],
      operations: [
        {
          sequence: 1,
          name: 'Precision Frame Assembly',
          workCenter: workCentersByCode['WC-ASM-02']._id,
          durationMinutes: 45,
        },
        {
          sequence: 2,
          name: 'Sanding & Varnish Coating',
          workCenter: workCentersByCode['WC-PNT-03']._id,
          durationMinutes: 30,
        },
        {
          sequence: 3,
          name: 'Quality Inspection & Boxing',
          workCenter: workCentersByCode['WC-PKG-04']._id,
          durationMinutes: 15,
        },
      ],
    },

    // BOM 2: Ergonomic Executive Chair
    {
      code: 'BOM-CHR-002',
      finishedProduct: chairProduct._id,
      quantity: 1,
      version: '1.2',
      isActive: true,
      notes: 'BOM revision for ergonomic swivel chair with aluminum base.',
      components: [
        {
          product: productsBySku['CM-FRM-202']._id,
          quantity: 1,
          unitOfMeasure: 'pcs',
        },
        {
          product: productsBySku['CM-CSH-201']._id,
          quantity: 1,
          unitOfMeasure: 'pcs',
        },
        {
          product: productsBySku['CM-SCR-103']._id,
          quantity: 1,
          unitOfMeasure: 'box',
        },
      ],
      operations: [
        {
          sequence: 1,
          name: 'Base & Mechanism Mount',
          workCenter: workCentersByCode['WC-ASM-02']._id,
          durationMinutes: 25,
        },
        {
          sequence: 2,
          name: 'Cushion Fabric Fitment & Test',
          workCenter: workCentersByCode['WC-PKG-04']._id,
          durationMinutes: 20,
        },
      ],
    },
  ];
};

export default getBOMSeedData;
