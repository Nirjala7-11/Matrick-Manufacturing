import mongoose from 'mongoose';

/**
 * Connects to MongoDB via Mongoose with production options, connection event listeners,
 * and masked log statements to avoid exposing credentials.
 */
export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manufacturing_db';

  // Helper to mask credentials in connection URI for logs
  const maskedURI = mongoURI.replace(/\/\/(.*?)@/, '//***:***@');

  try {
    mongoose.set('strictQuery', true);

    // Mongoose connection options
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in dev, disable autoIndex in prod for performance
    });

    console.log(`[MongoDB] Successfully connected to database: ${conn.connection.name} @ ${maskedURI.split('/')[2] || 'localhost'}`);

    // Connection lifecycle event handlers
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Database connection lost. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Database connection re-established.');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection error (${maskedURI}):`, error.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('[MongoDB] Fatal: Could not connect to database in production. Exiting process...');
      process.exit(1);
    }
    console.warn('[MongoDB] Running in fallback mode. API routes requiring database will fail gracefully until MongoDB is connected.');
  }
}

export default connectDB;
