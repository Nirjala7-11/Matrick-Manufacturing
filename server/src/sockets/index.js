import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { findUserById } from '../services/auth.service.js';
import { registerManufacturingSocket } from './manufacturing.socket.js';
import { registerAnalyticsSocket } from './analytics.socket.js';
import { setIO } from '../services/socket.service.js';

let ioInstance = null;

/**
 * Initialize Socket.IO instance attached to HTTP Server or existing Socket.IO instance.
 * Configures CORS, authentication middleware, event namespaces/rooms, and connection logging.
 */
export const initSocketIO = (serverOrIO, app = null) => {
  if (!serverOrIO) {
    throw new Error('initSocketIO requires an HTTP server or Socket.IO instance.');
  }

  let io;
  if (typeof serverOrIO.use === 'function' && typeof serverOrIO.on === 'function' && serverOrIO.sockets) {
    io = serverOrIO;
  } else {
    io = new SocketIOServer(serverOrIO, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      path: '/socket.io/',
    });
  }

  ioInstance = io;
  setIO(io);

  if (app && typeof app.set === 'function') {
    app.set('io', io);
  }

  // Socket.IO JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.startsWith('Bearer ') &&
          socket.handshake.headers.authorization.split(' ')[1]);

      if (!token) {
        return next(new Error('Authentication failed: JWT token is required.'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication failed: Invalid token payload.'));
      }

      const user = await findUserById(decoded.id);
      if (!user) {
        return next(new Error('Authentication failed: Authenticated user no longer exists.'));
      }

      // Attach safe user identity to socket.data
      socket.data.user = {
        id: user._id ? user._id.toString() : user.id,
        fullName: user.fullName || user.name || '',
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      logger.error('Socket.IO connection authentication error:', { message: err.message });
      return next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Handle Socket Connection & Event Registrations
  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`Socket client connected: ${socket.id} (User: ${user?.email || 'Unknown'})`);

    // Register socket handlers
    registerManufacturingSocket(io, socket);
    registerAnalyticsSocket(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for client ${socket.id}:`, { message: err.message });
    });
  });

  logger.info('Socket.IO real-time notification engine initialized.');
  return io;
};

export const getIO = () => ioInstance;

export default initSocketIO;
