import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import env, { logEnvSummary } from './config/env.js';
import logger from './config/logger.js';

// Re-export connectDB for external consumers (e.g., dev entry points)
export { connectDB };

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Graceful shutdown handler
function handleGracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during MongoDB connection shutdown:', { message: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Forceful shutdown executed after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

/**
 * Starts the application server after establishing database connection.
 */
export async function startServer() {
  try {
    logEnvSummary();

    // Establish MongoDB connection before accepting traffic
    logger.info('Connecting to MongoDB database...');
    await connectDB();

    return new Promise((resolve, reject) => {
      server.listen(env.PORT, '0.0.0.0', () => {
        logger.info(`🚀 MMS Backend Server successfully running on http://0.0.0.0:${env.PORT}`);
        resolve({ server, app });
      });

      server.on('error', (err) => {
        logger.error('Failed to start HTTP server:', { message: err.message });
        reject(err);
      });
    });
  } catch (error) {
    logger.error('Fatal server startup failure:', { message: error.message });
    process.exit(1);
  }
}

export { app, server };
export default startServer;
