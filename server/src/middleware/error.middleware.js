import logger from '../config/logger.js';
import env from '../config/env.js';

/**
 * Centralized Express Error Handling Middleware.
 * Standardizes API error responses and handles Mongoose, JWT, and generic server errors safely.
 */
export const errorMiddleware = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed for one or more fields';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid resource identifier format for field '${err.path}'`;
  }

  // Handle MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A resource with that ${field} already exists`;
    details = { field, value: err.keyValue ? err.keyValue[field] : undefined };
  }

  // Handle JWT Auth Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid authentication token provided';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please log in again.';
  }

  // Log error using structured logger (excluding secret data)
  logger.error(`${errorCode} [${statusCode}] ${req.method} ${req.originalUrl || req.url}: ${message}`, {
    statusCode,
    errorCode,
    stack: !env.IS_PRODUCTION ? err.stack : undefined,
  });

  // Construct standard error payload
  const responsePayload = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && { details }),
      ...(!env.IS_PRODUCTION && err.stack && { stack: err.stack }),
    },
  };

  return res.status(statusCode).json(responsePayload);
};

export default errorMiddleware;
