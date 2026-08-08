import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Import Mongoose Models
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import WorkCenter from '../src/models/WorkCenter.js';
import BOM from '../src/models/BOM.js';
import ManufacturingOrder from '../src/models/ManufacturingOrder.js';
import WorkOrder from '../src/models/WorkOrder.js';
import StockLedger from '../src/models/StockLedger.js';

// Import Seed Data Modules
import usersSeed from '../../database/seed/users.seed.js';
import productsSeed from '../../database/seed/products.seed.js';
import workCentersSeed from '../../database/seed/workcenters.seed.js';
import getBOMSeedData from '../../database/seed/bom.seed.js';
import getMOSeedData from '../../database/seed/manufacturingOrders.seed.js';
import getStockSeedData from '../../database/seed/stock.seed.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mms_db';

/**
 * Main Database Seeder Script
 */
async function seedDatabase() {
  console.log('--------------------------------------------------');
  console.log('🌱 Starting Matrick Manufacturing System Database Seeder');
  console.log('--------------------------------------------------');

  try {
    console.log(`📡 Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Clear Existing Demo Data (Safe re-executable operation)
    console.log('🧹 Cleaning existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      WorkCenter.deleteMany({}),
      BOM.deleteMany({}),
      ManufacturingOrder.deleteMany({}),
      WorkOrder.deleteMany({}),
      StockLedger.deleteMany({}),
    ]);
    console.log('✅ Collections cleared.');

    // 2. Seed Users
    console.log('👤 Seeding Users...');
    const createdUsers = [];
    for (const u of usersSeed) {
      const userDoc = await User.create(u);
      createdUsers.push(userDoc);
    }
    console.log(`✅ Seeded ${createdUsers.length} users.`);

    const usersByRole = {};
    createdUsers.forEach((u) => {
      usersByRole[u.role] = u;
    });

    // 3. Seed Products
    console.log('📦 Seeding Products...');
    const createdProducts = await Product.insertMany(productsSeed);
    console.log(`✅ Seeded ${createdProducts.length} products.`);

    const productsBySku = {};
    createdProducts.forEach((p) => {
      productsBySku[p.sku] = p;
    });

    // 4. Seed Work Centers
    console.log('🏭 Seeding Work Centers...');
    const createdWorkCenters = await WorkCenter.insertMany(workCentersSeed);
    console.log(`✅ Seeded ${createdWorkCenters.length} work centers.`);

    const workCentersByCode = {};
    createdWorkCenters.forEach((wc) => {
      workCentersByCode[wc.code] = wc;
    });

    // 5. Seed Bills of Materials (BOM)
    console.log('📋 Seeding Bill of Materials (BOMs)...');
    const bomSeedData = getBOMSeedData(productsBySku, workCentersByCode);
    const createdBOMs = await BOM.insertMany(bomSeedData);
    console.log(`✅ Seeded ${createdBOMs.length} BOMs.`);

    const bomsByCode = {};
    createdBOMs.forEach((b) => {
      bomsByCode[b.code] = b;
    });

    // 6. Seed Manufacturing Orders (MO)
    console.log('⚙️ Seeding Manufacturing Orders (MOs)...');
    const moSeedData = getMOSeedData(productsBySku, bomsByCode, usersByRole);
    const createdMOs = await ManufacturingOrder.insertMany(moSeedData);
    console.log(`✅ Seeded ${createdMOs.length} Manufacturing Orders.`);

    // 7. Generate Work Orders (WO) derived from MO Operations
    console.log('🔨 Generating Work Orders for Manufacturing Orders...');
    const workOrderDocs = [];
    const operatorUser = usersByRole['operator'] || usersByRole['admin'];

    for (const mo of createdMOs) {
      const parentBOM = createdBOMs.find((b) => b._id.toString() === mo.bom.toString());
      if (parentBOM && parentBOM.operations && parentBOM.operations.length > 0) {
        parentBOM.operations.forEach((op) => {
          let woStatus = 'pending';
          if (mo.status === 'in_progress') {
            woStatus = op.sequence === 1 ? 'in_progress' : 'ready';
          } else if (mo.status === 'confirmed') {
            woStatus = op.sequence === 1 ? 'ready' : 'pending';
          } else if (mo.status === 'completed') {
            woStatus = 'completed';
          }

          workOrderDocs.push({
            woNumber: `${mo.moNumber}-WO-${String(op.sequence).padStart(2, '0')}`,
            manufacturingOrder: mo._id,
            operationName: op.name,
            sequence: op.sequence,
            workCenter: op.workCenter,
            plannedDurationMinutes: op.durationMinutes,
            actualDurationMinutes: mo.status === 'in_progress' ? Math.floor(op.durationMinutes * 0.5) : 0,
            status: woStatus,
            assignedOperator: operatorUser._id,
            notes: `Operation #${op.sequence} for Manufacturing Order ${mo.moNumber}`,
          });
        });
      }
    }

    const createdWorkOrders = await WorkOrder.insertMany(workOrderDocs);
    console.log(`✅ Created ${createdWorkOrders.length} Work Orders.`);

    // 8. Seed Stock Ledger Entries
    console.log('📊 Seeding Stock Ledger Audit Logs...');
    const stockSeedData = getStockSeedData(productsBySku, usersByRole, createdMOs);
    const createdStockEntries = await StockLedger.insertMany(stockSeedData);
    console.log(`✅ Seeded ${createdStockEntries.length} stock ledger entries.`);

    console.log('--------------------------------------------------');
    console.log('🎉 Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Login Credentials:');
    console.log('  Admin:     admin@matrick.com / Password123!');
    console.log('  Manager:   manager@matrick.com / Password123!');
    console.log('  Operator:  operator@matrick.com / Password123!');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

seedDatabase();
