import mongoose from 'mongoose';
import logger from '../config/logger.js';

const isValidObjectId = (id) => {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Register Manufacturing real-time socket events and room subscriptions.
 */
export const registerManufacturingSocket = (io, socket) => {
  const user = socket.data.user;

  // 1. Join/Leave General Manufacturing Room
  socket.on('joinManufacturing', (ackCallback) => {
    try {
      const room = 'manufacturing:all';
      socket.join(room);
      logger.debug(`Socket user ${user?.email} joined room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room });
      }
    } catch (err) {
      logger.error('Error joining manufacturing room:', { message: err.message });
    }
  });

  socket.on('leaveManufacturing', (ackCallback) => {
    try {
      const room = 'manufacturing:all';
      socket.leave(room);
      logger.debug(`Socket user ${user?.email} left room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room });
      }
    } catch (err) {
      logger.error('Error leaving manufacturing room:', { message: err.message });
    }
  });

  // 2. Join/Leave Manufacturing Order Room
  socket.on('joinMO', (payload, ackCallback) => {
    try {
      const moId = typeof payload === 'string' ? payload : payload?.moId;
      if (!isValidObjectId(moId)) {
        if (typeof ackCallback === 'function') {
          return ackCallback({ success: false, message: 'Invalid Manufacturing Order ID' });
        }
        return;
      }

      const room = `manufacturing:mo:${moId}`;
      socket.join(room);
      logger.debug(`Socket user ${user?.email} joined MO room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, moId });
      }
    } catch (err) {
      logger.error('Error joining MO room:', { message: err.message });
    }
  });

  socket.on('leaveMO', (payload, ackCallback) => {
    try {
      const moId = typeof payload === 'string' ? payload : payload?.moId;
      if (!moId) return;

      const room = `manufacturing:mo:${moId}`;
      socket.leave(room);
      logger.debug(`Socket user ${user?.email} left MO room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, moId });
      }
    } catch (err) {
      logger.error('Error leaving MO room:', { message: err.message });
    }
  });

  // 3. Join/Leave Work Order Room
  socket.on('joinWorkOrder', (payload, ackCallback) => {
    try {
      const workOrderId = typeof payload === 'string' ? payload : payload?.workOrderId;
      if (!isValidObjectId(workOrderId)) {
        if (typeof ackCallback === 'function') {
          return ackCallback({ success: false, message: 'Invalid Work Order ID' });
        }
        return;
      }

      const room = `manufacturing:work-order:${workOrderId}`;
      socket.join(room);
      logger.debug(`Socket user ${user?.email} joined Work Order room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, workOrderId });
      }
    } catch (err) {
      logger.error('Error joining Work Order room:', { message: err.message });
    }
  });

  socket.on('leaveWorkOrder', (payload, ackCallback) => {
    try {
      const workOrderId = typeof payload === 'string' ? payload : payload?.workOrderId;
      if (!workOrderId) return;

      const room = `manufacturing:work-order:${workOrderId}`;
      socket.leave(room);
      logger.debug(`Socket user ${user?.email} left Work Order room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, workOrderId });
      }
    } catch (err) {
      logger.error('Error leaving Work Order room:', { message: err.message });
    }
  });

  // 4. Join/Leave Work Center Room
  socket.on('joinWorkCenter', (payload, ackCallback) => {
    try {
      const workCenterId = typeof payload === 'string' ? payload : payload?.workCenterId;
      if (!isValidObjectId(workCenterId)) {
        if (typeof ackCallback === 'function') {
          return ackCallback({ success: false, message: 'Invalid Work Center ID' });
        }
        return;
      }

      const room = `manufacturing:work-center:${workCenterId}`;
      socket.join(room);
      logger.debug(`Socket user ${user?.email} joined Work Center room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, workCenterId });
      }
    } catch (err) {
      logger.error('Error joining Work Center room:', { message: err.message });
    }
  });

  socket.on('leaveWorkCenter', (payload, ackCallback) => {
    try {
      const workCenterId = typeof payload === 'string' ? payload : payload?.workCenterId;
      if (!workCenterId) return;

      const room = `manufacturing:work-center:${workCenterId}`;
      socket.leave(room);
      logger.debug(`Socket user ${user?.email} left Work Center room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room, workCenterId });
      }
    } catch (err) {
      logger.error('Error leaving Work Center room:', { message: err.message });
    }
  });
};

export default registerManufacturingSocket;
