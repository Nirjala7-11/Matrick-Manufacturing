import mongoose from 'mongoose';
import ManufacturingOrder from '../models/ManufacturingOrder.js';
import WorkOrder from '../models/WorkOrder.js';
import StockLedger from '../models/StockLedger.js';
import Product from '../models/Product.js';
import WorkCenter from '../models/WorkCenter.js';
import BOM from '../models/BOM.js';

/**
 * Helper: Parse and validate date range parameters.
 * Defaults to last 30 days if range is not fully provided.
 */
const parseDateRange = (startDateStr, endDateStr) => {
  const now = new Date();
  let endDate = endDateStr ? new Date(endDateStr) : new Date(now);

  if (isNaN(endDate.getTime())) {
    const err = new Error('Invalid endDate format. Expected YYYY-MM-DD');
    err.statusCode = 400;
    err.code = 'INVALID_DATE';
    throw err;
  }

  // Set endDate to the end of the specified day (23:59:59.999)
  if (endDateStr && !endDateStr.includes('T')) {
    endDate.setUTCHours(23, 59, 59, 999);
  }

  let startDate = startDateStr ? new Date(startDateStr) : new Date(endDate);
  if (!startDateStr) {
    startDate.setDate(startDate.getDate() - 30);
    startDate.setUTCHours(0, 0, 0, 0);
  } else if (isNaN(startDate.getTime())) {
    const err = new Error('Invalid startDate format. Expected YYYY-MM-DD');
    err.statusCode = 400;
    err.code = 'INVALID_DATE';
    throw err;
  } else if (!startDateStr.includes('T')) {
    startDate.setUTCHours(0, 0, 0, 0);
  }

  if (startDate > endDate) {
    const err = new Error('startDate cannot be after endDate');
    err.statusCode = 400;
    err.code = 'INVALID_DATE_RANGE';
    throw err;
  }

  return { startDate, endDate };
};

/**
 * Helper: Validate ObjectId string
 */
const validateObjectId = (id, paramName = 'ID') => {
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Invalid ${paramName} parameter`);
    err.statusCode = 400;
    err.code = 'INVALID_OBJECT_ID';
    throw err;
  }
};

/**
 * 1. Manufacturing Dashboard Overview / KPIs
 */
export const getOverview = async (query = {}) => {
  const { startDate, endDate } = parseDateRange(query.startDate, query.endDate);

  const [
    totalProducts,
    activeProducts,
    categoryCounts,
    totalWorkCenters,
    activeWorkCenters,
    totalBoms,
    activeBoms,
    moStatusCounts,
    totalMoCount,
    finishedGoodsStats,
    componentAvailabilityCounts,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    WorkCenter.countDocuments(),
    WorkCenter.countDocuments({ status: 'active', isActive: true }),
    BOM.countDocuments(),
    BOM.countDocuments({ isActive: true }),
    ManufacturingOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ManufacturingOrder.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    StockLedger.aggregate([
      {
        $match: {
          movementType: 'FINISHED_GOODS_PRODUCTION',
          movementDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          eventCount: { $sum: 1 },
        },
      },
    ]),
    ManufacturingOrder.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'in_progress'] },
        },
      },
      { $group: { _id: '$componentAvailabilityStatus', count: { $sum: 1 } } },
    ]),
  ]);

  // Transform status aggregation into map
  const moStatusMap = {
    draft: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };
  moStatusCounts.forEach((item) => {
    if (item._id && moStatusMap[item._id] !== undefined) {
      moStatusMap[item._id] = item.count;
    }
  });

  // Calculate delayed MO count
  const now = new Date();
  const delayedMoCount = await ManufacturingOrder.countDocuments({
    $or: [
      {
        status: { $in: ['draft', 'confirmed', 'in_progress'] },
        plannedEndDate: { $lt: now, $ne: null },
      },
      {
        status: 'completed',
        plannedEndDate: { $ne: null },
        $expr: { $gt: ['$actualEndDate', '$plannedEndDate'] },
      },
    ],
  });

  const categoryMap = {};
  categoryCounts.forEach((item) => {
    categoryMap[item._id || 'unassigned'] = item.count;
  });

  const compAvailabilityMap = {
    available: 0,
    insufficient: 0,
    partially_available: 0,
  };
  componentAvailabilityCounts.forEach((item) => {
    if (item._id && compAvailabilityMap[item._id] !== undefined) {
      compAvailabilityMap[item._id] = item.count;
    }
  });

  return {
    filters: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    masterData: {
      products: {
        total: totalProducts,
        active: activeProducts,
        byCategory: categoryMap,
      },
      workCenters: {
        total: totalWorkCenters,
        active: activeWorkCenters,
      },
      boms: {
        total: totalBoms,
        active: activeBoms,
      },
    },
    manufacturingOrders: {
      total: totalMoCount,
      byStatus: moStatusMap,
      delayedCount: delayedMoCount,
      activeComponentAvailability: compAvailabilityMap,
    },
    productionSummary: {
      totalProducedQuantity: finishedGoodsStats[0]?.totalQuantity || 0,
      totalProductionEvents: finishedGoodsStats[0]?.eventCount || 0,
    },
  };
};

/**
 * 2. Production Throughput Analytics
 * Source: StockLedger records with movementType FINISHED_GOODS_PRODUCTION
 */
export const getProductionThroughput = async (query = {}) => {
  const { startDate, endDate } = parseDateRange(query.startDate, query.endDate);
  if (query.productId) {
    validateObjectId(query.productId, 'productId');
  }

  const matchStage = {
    movementType: 'FINISHED_GOODS_PRODUCTION',
    movementDate: { $gte: startDate, $lte: endDate },
  };

  if (query.productId) {
    matchStage.product = new mongoose.Types.ObjectId(query.productId);
  }

  const [overallStats, productionByProduct, productionTrend] = await Promise.all([
    // Overall quantity and count
    StockLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          eventCount: { $sum: 1 },
        },
      },
    ]),

    // Breakdown by Product
    StockLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          eventCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productInfo.name',
          sku: '$productInfo.sku',
          unitOfMeasure: '$productInfo.unitOfMeasure',
          category: '$productInfo.category',
          totalQuantity: 1,
          eventCount: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]),

    // Production trend over time (by day)
    StockLedger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$movementDate' },
          },
          quantity: { $sum: '$quantity' },
          events: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          quantity: 1,
          events: 1,
        },
      },
    ]),
  ]);

  return {
    filters: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      productId: query.productId || null,
    },
    metrics: {
      totalProducedQuantity: overallStats[0]?.totalQuantity || 0,
      totalProductionEvents: overallStats[0]?.eventCount || 0,
    },
    productionByProduct,
    trend: productionTrend,
  };
};

/**
 * 3. Manufacturing Order Delays Analytics
 * Source: ManufacturingOrder collection
 */
export const getOrderDelays = async (query = {}) => {
  const { startDate, endDate } = parseDateRange(query.startDate, query.endDate);
  if (query.productId) {
    validateObjectId(query.productId, 'productId');
  }

  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (query.productId) {
    matchStage.finishedProduct = new mongoose.Types.ObjectId(query.productId);
  }

  const now = new Date();

  const [statusBreakdown, orders] = await Promise.all([
    ManufacturingOrder.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ManufacturingOrder.find(matchStage)
      .populate('finishedProduct', 'name sku unitOfMeasure')
      .lean(),
  ]);

  const byStatus = {
    draft: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  statusBreakdown.forEach((item) => {
    if (item._id && byStatus[item._id] !== undefined) {
      byStatus[item._id] = item.count;
    }
  });

  let delayedOrdersCount = 0;
  let totalDelayMs = 0;
  let unspecifiedPlannedEndDateCount = 0;
  const delayedOrderDetails = [];

  orders.forEach((mo) => {
    const plannedEnd = mo.plannedEndDate ? new Date(mo.plannedEndDate) : null;

    if (!plannedEnd) {
      unspecifiedPlannedEndDateCount++;
      return;
    }

    let isDelayed = false;
    let delayMs = 0;

    if (mo.status === 'completed') {
      const actualEnd = mo.actualEndDate ? new Date(mo.actualEndDate) : new Date(mo.updatedAt);
      if (actualEnd > plannedEnd) {
        isDelayed = true;
        delayMs = actualEnd.getTime() - plannedEnd.getTime();
      }
    } else if (['draft', 'confirmed', 'in_progress'].includes(mo.status)) {
      if (now > plannedEnd) {
        isDelayed = true;
        delayMs = now.getTime() - plannedEnd.getTime();
      }
    }

    if (isDelayed) {
      delayedOrdersCount++;
      totalDelayMs += delayMs;

      const delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 10) / 10;
      const delayDays = Math.round((delayMs / (1000 * 60 * 60 * 24)) * 10) / 10;

      delayedOrderDetails.push({
        moId: mo._id,
        moNumber: mo.moNumber,
        productName: mo.finishedProduct?.name || 'Unknown',
        sku: mo.finishedProduct?.sku || 'N/A',
        status: mo.status,
        quantity: mo.quantity,
        plannedEndDate: mo.plannedEndDate,
        actualEndDate: mo.actualEndDate || null,
        delayHours,
        delayDays,
      });
    }
  });

  const averageDelayHours =
    delayedOrdersCount > 0
      ? Math.round((totalDelayMs / (delayedOrdersCount * 1000 * 60 * 60)) * 10) / 10
      : 0;

  const averageDelayDays =
    delayedOrdersCount > 0
      ? Math.round((totalDelayMs / (delayedOrdersCount * 1000 * 60 * 60 * 24)) * 10) / 10
      : 0;

  return {
    filters: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      productId: query.productId || null,
    },
    metrics: {
      totalOrders: orders.length,
      byStatus,
      delayedOrdersCount,
      onTimeCompletedOrders: Math.max(0, byStatus.completed - delayedOrdersCount),
      averageDelayHours,
      averageDelayDays,
      unspecifiedPlannedEndDateCount,
    },
    delayedOrders: delayedOrderDetails,
  };
};

/**
 * 4. Resource Utilization Analytics
 * Source: WorkOrder and WorkCenter collections
 */
export const getResourceUtilization = async (query = {}) => {
  const { startDate, endDate } = parseDateRange(query.startDate, query.endDate);
  if (query.workCenterId) {
    validateObjectId(query.workCenterId, 'workCenterId');
  }

  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (query.workCenterId) {
    matchStage.workCenter = new mongoose.Types.ObjectId(query.workCenterId);
  }

  const [overallWoStats, byWorkCenterStats] = await Promise.all([
    // Overall Work Order duration stats
    WorkOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          plannedDurationMinutes: { $sum: '$plannedDurationMinutes' },
          actualDurationMinutes: { $sum: '$actualDurationMinutes' },
        },
      },
    ]),

    // Work Order stats grouped by Work Center
    WorkOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$workCenter',
          totalWorkOrders: { $sum: 1 },
          completedWorkOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          inProgressWorkOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          plannedDurationMinutes: { $sum: '$plannedDurationMinutes' },
          actualDurationMinutes: { $sum: '$actualDurationMinutes' },
        },
      },
      {
        $lookup: {
          from: 'workcenters',
          localField: '_id',
          foreignField: '_id',
          as: 'workCenterInfo',
        },
      },
      { $unwind: '$workCenterInfo' },
      {
        $project: {
          _id: 0,
          workCenterId: '$_id',
          workCenterName: '$workCenterInfo.name',
          workCenterCode: '$workCenterInfo.code',
          capacityPerHour: '$workCenterInfo.capacityPerHour',
          costPerHour: '$workCenterInfo.costPerHour',
          status: '$workCenterInfo.status',
          totalWorkOrders: 1,
          completedWorkOrders: 1,
          inProgressWorkOrders: 1,
          plannedDurationMinutes: 1,
          actualDurationMinutes: 1,
        },
      },
      { $sort: { actualDurationMinutes: -1 } },
    ]),
  ]);

  const woStatusBreakdown = {
    pending: 0,
    ready: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    cancelled: 0,
  };

  let totalPlannedMins = 0;
  let totalActualMins = 0;
  let totalWoCount = 0;

  overallWoStats.forEach((item) => {
    if (item._id && woStatusBreakdown[item._id] !== undefined) {
      woStatusBreakdown[item._id] = item.count;
    }
    totalWoCount += item.count || 0;
    totalPlannedMins += item.plannedDurationMinutes || 0;
    totalActualMins += item.actualDurationMinutes || 0;
  });

  // Calculate operational utilization ratio for each work center
  const formattedWorkCenters = byWorkCenterStats.map((wc) => {
    const plannedHrs = Math.round((wc.plannedDurationMinutes / 60) * 10) / 10;
    const actualHrs = Math.round((wc.actualDurationMinutes / 60) * 10) / 10;

    const operationalUtilizationRatio =
      wc.plannedDurationMinutes > 0
        ? Math.round((wc.actualDurationMinutes / wc.plannedDurationMinutes) * 100 * 10) / 10
        : 0;

    return {
      ...wc,
      plannedHours: plannedHrs,
      actualHours: actualHrs,
      operationalUtilizationRatioPercentage: operationalUtilizationRatio,
    };
  });

  const overallUtilizationRatio =
    totalPlannedMins > 0 ? Math.round((totalActualMins / totalPlannedMins) * 100 * 10) / 10 : 0;

  return {
    filters: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      workCenterId: query.workCenterId || null,
    },
    metrics: {
      totalWorkOrders: totalWoCount,
      byStatus: woStatusBreakdown,
      totalPlannedDurationHours: Math.round((totalPlannedMins / 60) * 10) / 10,
      totalActualDurationHours: Math.round((totalActualMins / 60) * 10) / 10,
      overallOperationalUtilizationPercentage: overallUtilizationRatio,
      note: 'Operational utilization is calculated as actual work duration vs planned duration across executed work orders.',
    },
    byWorkCenter: formattedWorkCenters,
  };
};

export const analyticsService = {
  getOverview,
  getProductionThroughput,
  getOrderDelays,
  getResourceUtilization,
};

export default analyticsService;
