import logger from '../config/logger.js';

/**
 * Register Analytics real-time notification socket room handlers.
 */
export const registerAnalyticsSocket = (io, socket) => {
  const user = socket.data.user;

  socket.on('joinAnalytics', (ackCallback) => {
    try {
      const room = 'analytics';
      socket.join(room);
      logger.debug(`Socket user ${user?.email} joined analytics notification room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room });
      }
    } catch (err) {
      logger.error('Error joining analytics room:', { message: err.message });
    }
  });

  socket.on('leaveAnalytics', (ackCallback) => {
    try {
      const room = 'analytics';
      socket.leave(room);
      logger.debug(`Socket user ${user?.email} left analytics notification room: ${room}`);
      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, room });
      }
    } catch (err) {
      logger.error('Error leaving analytics room:', { message: err.message });
    }
  });
};

export default registerAnalyticsSocket;
