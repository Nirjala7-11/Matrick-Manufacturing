/**
 * Product Seed Data
 * Raw materials, components, assemblies, and finished goods for manufacturing operations.
 */
export const productsSeed = [
  // Raw Materials
  {
    name: 'Oak Wooden Legs',
    sku: 'RM-LEG-101',
    category: 'raw_material',
    unitOfMeasure: 'pcs',
    stockOnHand: 250,
    minStockLevel: 50,
    costPrice: 12.50,
    sellingPrice: 0,
    description: 'Precision-turned solid oak wooden legs for furniture assembly.',
    isActive: true,
  },
  {
    name: 'Teak Wood Tabletop',
    sku: 'RM-TOP-102',
    category: 'raw_material',
    unitOfMeasure: 'pcs',
    stockOnHand: 80,
    minStockLevel: 20,
    costPrice: 48.00,
    sellingPrice: 0,
    description: 'Sanded grade-A teak wood panel (150cm x 90cm x 3cm).',
    isActive: true,
  },
  {
    name: 'Wood Finish Varnish & Polish',
    sku: 'RM-VAR-104',
    category: 'raw_material',
    unitOfMeasure: 'liter',
    stockOnHand: 120,
    minStockLevel: 30,
    costPrice: 18.20,
    sellingPrice: 0,
    description: 'High-gloss eco-friendly polyurethane wood finish.',
    isActive: true,
  },

  // Components
  {
    name: 'Stainless Steel Screws Set (50pcs)',
    sku: 'CM-SCR-103',
    category: 'component',
    unitOfMeasure: 'box',
    stockOnHand: 300,
    minStockLevel: 40,
    costPrice: 4.50,
    sellingPrice: 0,
    description: 'M6x45mm heavy-duty anti-corrosive steel mounting fasteners.',
    isActive: true,
  },
  {
    name: 'Ergonomic Cushion Pad',
    sku: 'CM-CSH-201',
    category: 'component',
    unitOfMeasure: 'pcs',
    stockOnHand: 150,
    minStockLevel: 30,
    costPrice: 15.00,
    sellingPrice: 0,
    description: 'High-density memory foam seat cushion with mesh cover.',
    isActive: true,
  },
  {
    name: 'Aluminum Chair Frame Base',
    sku: 'CM-FRM-202',
    category: 'component',
    unitOfMeasure: 'pcs',
    stockOnHand: 90,
    minStockLevel: 15,
    costPrice: 32.00,
    sellingPrice: 0,
    description: 'Die-cast 5-star aluminum base with smooth swivel casters.',
    isActive: true,
  },

  // Finished Goods
  {
    name: 'Wooden Executive Table',
    sku: 'FP-TAB-001',
    category: 'finished_goods',
    unitOfMeasure: 'pcs',
    stockOnHand: 25,
    minStockLevel: 5,
    costPrice: 115.00,
    sellingPrice: 380.00,
    description: 'Handcrafted solid oak executive workspace table.',
    isActive: true,
  },
  {
    name: 'Ergonomic Executive Chair',
    sku: 'FP-CHR-002',
    category: 'finished_goods',
    unitOfMeasure: 'pcs',
    stockOnHand: 40,
    minStockLevel: 10,
    costPrice: 85.00,
    sellingPrice: 240.00,
    description: 'Adjustable mesh office chair with lumbar support and aluminum base.',
    isActive: true,
  },
];

export default productsSeed;
