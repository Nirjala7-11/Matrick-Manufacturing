import logger from '../config/logger.js';

let ioInstance = null;

/**
 * Set the global Socket.IO server instance
 */
export const setIO = (io) => {
  ioInstance = io;
  logger.info('[SocketService] Socket.IO instance attached to socket service.');
};

/**
 * Get the global Socket.IO server instance
 */
export const getIO = () => ioInstance;

/**
 * Helper to safely emit event payloads to specified room(s)
 */
const emitToRooms = (rooms, eventName, payload) => {
  if (!ioInstance) {
    logger.debug(`[SocketService] Skip emit '${eventName}': Socket.IO is not initialized.`);
    return;
  }

  const roomList = (Array.isArray(rooms) ? rooms : [rooms]).filter(Boolean);

  if (roomList.length === 0) {
    ioInstance.emit(eventName, payload);
    return;
  }

  roomList.forEach((room) => {
    ioInstance.to(room).emit(eventName, payload);
  });
};

// ==================================================
// MANUFACTURING ORDER EVENTS
// ==================================================

export const emitManufacturingOrderCreated = (mo) => {
  if (!mo) return;
  const moId = mo._id ? mo._id.toString() : mo.id;

  const payload = {
    event: 'manufacturing:mo:created',
    data: {
      moId,
      moNumber: mo.moNumber,
      finishedProduct: mo.finishedProduct,
      quantity: mo.quantity,
      status: mo.status,
      createdAt: mo.createdAt || new Date().toISOString(),
    },
  };

  emitToRooms(['manufacturing:all'], 'manufacturing:mo:created', payload);
  emitAnalyticsUpdated('mo_created', { moId, status: mo.status });
};

export const emitManufacturingOrderUpdated = (mo) => {
  if (!mo) return;
  const moId = mo._id ? mo._id.toString() : mo.id;

  const payload = {
    event: 'manufacturing:mo:updated',
    data: {
      moId,
      moNumber: mo.moNumber,
      status: mo.status,
      componentAvailabilityStatus: mo.componentAvailabilityStatus,
      quantity: mo.quantity,
      updatedAt: mo.updatedAt || new Date().toISOString(),
    },
  };

  emitToRooms(['manufacturing:all', `manufacturing:mo:${moId}`], 'manufacturing:mo:updated', payload);
  emitAnalyticsUpdated('mo_updated', { moId, status: mo.status });
};

export const emitManufacturingOrderStarted = (mo) => {
  if (!mo) return;
  const moId = mo._id ? mo._id.toString() : mo.id;

  const payload = {
    event: 'manufacturing:mo:started',
    data: {
      moId,
      moNumber: mo.moNumber,
      status: mo.status || 'In Progress',
      startedAt: mo.plannedStartDate || new Date().toISOString(),
    },
  };

  emitToRooms(['manufacturing:all', `manufacturing:mo:${moId}`], 'manufacturing:mo:started', payload);
  emitAnalyticsUpdated('mo_started', { moId, status: mo.status });
};

export const emitManufacturingOrderCompleted = (mo) => {
  if (!mo) return;
  const moId = mo._id ? mo._id.toString() : mo.id;

  const payload = {
    event: 'manufacturing:mo:completed',
    data: {
      moId,
      moNumber: mo.moNumber,
      status: mo.status || 'Done',
      actualEndDate: mo.actualEndDate || new Date().toISOString(),
    },
  };

  emitToRooms(['manufacturing:all', `manufacturing:mo:${moId}`], 'manufacturing:mo:completed', payload);
  emitAnalyticsUpdated('mo_completed', { moId, status: mo.status });
};

export const emitManufacturingOrderCancelled = (mo) => {
  if (!mo) return;
  const moId = mo._id ? mo._id.toString() : mo.id;

  const payload = {
    event: 'manufacturing:mo:cancelled',
    data: {
      moId,
      moNumber: mo.moNumber,
      status: mo.status || 'Cancelled',
    },
  };

  emitToRooms(['manufacturing:all', `manufacturing:mo:${moId}`], 'manufacturing:mo:cancelled', payload);
  emitAnalyticsUpdated('mo_cancelled', { moId, status: mo.status });
};

// ==================================================
// WORK ORDER EVENTS
// ==================================================

export const emitWorkOrderCreated = (workOrder) => {
  if (!workOrder) return;
  const workOrderId = workOrder._id ? workOrder._id.toString() : workOrder.id;
  const moId = workOrder.manufacturingOrder ? workOrder.manufacturingOrder.toString() : null;
  const workCenterId = workOrder.workCenter ? workOrder.workCenter.toString() : null;

  const payload = {
    event: 'manufacturing:work-order:created',
    data: {
      workOrderId,
      workOrderNumber: workOrder.workOrderNumber,
      operationName: workOrder.operationName,
      moId,
      workCenterId,
      status: workOrder.status,
      sequence: workOrder.sequence,
    },
  };

  const rooms = [
    'manufacturing:all',
    moId ? `manufacturing:mo:${moId}` : null,
    workCenterId ? `manufacturing:work-center:${workCenterId}` : null,
  ];

  emitToRooms(rooms, 'manufacturing:work-order:created', payload);
};

export const emitWorkOrderStarted = (workOrder) => {
  if (!workOrder) return;
  const workOrderId = workOrder._id ? workOrder._id.toString() : workOrder.id;
  const moId = workOrder.manufacturingOrder ? workOrder.manufacturingOrder.toString() : null;
  const workCenterId = workOrder.workCenter ? workOrder.workCenter.toString() : null;

  const payload = {
    event: 'manufacturing:work-order:started',
    data: {
      workOrderId,
      workOrderNumber: workOrder.workOrderNumber,
      operationName: workOrder.operationName,
      moId,
      workCenterId,
      status: workOrder.status || 'In Progress',
      actualStartTime: workOrder.actualStartTime || new Date().toISOString(),
    },
  };

  const rooms = [
    'manufacturing:all',
    moId ? `manufacturing:mo:${moId}` : null,
    `manufacturing:work-order:${workOrderId}`,
    workCenterId ? `manufacturing:work-center:${workCenterId}` : null,
  ];

  emitToRooms(rooms, 'manufacturing:work-order:started', payload);
  emitAnalyticsUpdated('work_order_started', { workOrderId, workCenterId });
};

export const emitWorkOrderCompleted = (workOrder) => {
  if (!workOrder) return;
  const workOrderId = workOrder._id ? workOrder._id.toString() : workOrder.id;
  const moId = workOrder.manufacturingOrder ? workOrder.manufacturingOrder.toString() : null;
  const workCenterId = workOrder.workCenter ? workOrder.workCenter.toString() : null;

  const payload = {
    event: 'manufacturing:work-order:completed',
    data: {
      workOrderId,
      workOrderNumber: workOrder.workOrderNumber,
      operationName: workOrder.operationName,
      moId,
      workCenterId,
      status: workOrder.status || 'Done',
      actualEndTime: workOrder.actualEndTime || new Date().toISOString(),
      actualDurationMinutes: workOrder.actualDurationMinutes || 0,
    },
  };

  const rooms = [
    'manufacturing:all',
    moId ? `manufacturing:mo:${moId}` : null,
    `manufacturing:work-order:${workOrderId}`,
    workCenterId ? `manufacturing:work-center:${workCenterId}` : null,
  ];

  emitToRooms(rooms, 'manufacturing:work-order:completed', payload);
  emitAnalyticsUpdated('work_order_completed', { workOrderId, workCenterId });
};

export const emitWorkOrderBlocked = (workOrder) => {
  if (!workOrder) return;
  const workOrderId = workOrder._id ? workOrder._id.toString() : workOrder.id;
  const moId = workOrder.manufacturingOrder ? workOrder.manufacturingOrder.toString() : null;
  const workCenterId = workOrder.workCenter ? workOrder.workCenter.toString() : null;

  const payload = {
    event: 'manufacturing:work-order:blocked',
    data: {
      workOrderId,
      workOrderNumber: workOrder.workOrderNumber,
      operationName: workOrder.operationName,
      moId,
      workCenterId,
      status: workOrder.status || 'Blocked',
    },
  };

  const rooms = [
    'manufacturing:all',
    moId ? `manufacturing:mo:${moId}` : null,
    `manufacturing:work-order:${workOrderId}`,
    workCenterId ? `manufacturing:work-center:${workCenterId}` : null,
  ];

  emitToRooms(rooms, 'manufacturing:work-order:blocked', payload);
};

// ==================================================
// STOCK & PRODUCTION EVENTS
// ==================================================

export const emitStockConsumed = (stockLedger) => {
  if (!stockLedger) return;
  const ledgerId = stockLedger._id ? stockLedger._id.toString() : stockLedger.id;
  const productId = stockLedger.product ? stockLedger.product.toString() : null;
  const moId = stockLedger.manufacturingOrder ? stockLedger.manufacturingOrder.toString() : null;

  const payload = {
    event: 'manufacturing:stock:consumed',
    data: {
      ledgerId,
      productId,
      quantity: stockLedger.quantity,
      previousStock: stockLedger.previousStock,
      newStock: stockLedger.newStock,
      moId,
      movementDate: stockLedger.movementDate || new Date().toISOString(),
    },
  };

  const rooms = ['manufacturing:all', moId ? `manufacturing:mo:${moId}` : null];
  emitToRooms(rooms, 'manufacturing:stock:consumed', payload);
  emitAnalyticsUpdated('stock_consumed', { productId, quantity: stockLedger.quantity });
};

export const emitStockProduced = (stockLedger) => {
  if (!stockLedger) return;
  const ledgerId = stockLedger._id ? stockLedger._id.toString() : stockLedger.id;
  const productId = stockLedger.product ? stockLedger.product.toString() : null;
  const moId = stockLedger.manufacturingOrder ? stockLedger.manufacturingOrder.toString() : null;

  const payload = {
    event: 'manufacturing:stock:produced',
    data: {
      ledgerId,
      productId,
      quantity: stockLedger.quantity,
      previousStock: stockLedger.previousStock,
      newStock: stockLedger.newStock,
      moId,
      movementDate: stockLedger.movementDate || new Date().toISOString(),
    },
  };

  const rooms = ['manufacturing:all', moId ? `manufacturing:mo:${moId}` : null];
  emitToRooms(rooms, 'manufacturing:stock:produced', payload);
  emitAnalyticsUpdated('stock_produced', { productId, quantity: stockLedger.quantity });
};

export const emitProductionUpdated = (productionData = {}) => {
  const moId = productionData.moId || null;
  const payload = {
    event: 'manufacturing:production:updated',
    data: productionData,
  };

  const rooms = ['manufacturing:all', moId ? `manufacturing:mo:${moId}` : null];
  emitToRooms(rooms, 'manufacturing:production:updated', payload);
  emitAnalyticsUpdated('production_updated', productionData);
};

// ==================================================
// ANALYTICS NOTIFICATION EVENT
// ==================================================

export const emitAnalyticsUpdated = (type, details = {}) => {
  const payload = {
    event: 'analytics:updated',
    data: {
      type,
      timestamp: new Date().toISOString(),
      details,
    },
  };

  emitToRooms(['analytics'], 'analytics:updated', payload);
};

export const socketService = {
  setIO,
  getIO,
  emitManufacturingOrderCreated,
  emitManufacturingOrderUpdated,
  emitManufacturingOrderStarted,
  emitManufacturingOrderCompleted,
  emitManufacturingOrderCancelled,
  emitWorkOrderCreated,
  emitWorkOrderStarted,
  emitWorkOrderCompleted,
  emitWorkOrderBlocked,
  emitStockConsumed,
  emitStockProduced,
  emitProductionUpdated,
  emitAnalyticsUpdated,
};

export default socketService;
