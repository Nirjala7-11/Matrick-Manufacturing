import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findUserById } from '../services/auth.service.js';

/**
 * Authentication Middleware: Validates Bearer JWT token from Authorization header or cookies.
 * Attaches authenticated user object and role payload to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Check Authorization header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, 'Access denied. Authentication token required.', 'UNAUTHORIZED', 401);
  }

  try {
    // 2. Verify JWT token signature and expiration
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return sendError(res, 'Invalid authentication token payload.', 'INVALID_TOKEN', 401);
    }

    // 3. Fetch current user from database
    const user = await findUserById(decoded.id);
    if (!user) {
      return sendError(res, 'The user belonging to this token no longer exists.', 'USER_NOT_FOUND', 401);
    }

    // 4. Attach safe user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please log in again.', 'TOKEN_EXPIRED', 401);
    }
    return sendError(res, 'Invalid or malformed authentication token.', 'UNAUTHORIZED', 401);
  }
});

/**
 * Role Authorization Middleware: Restricts access to specified user roles.
 * Must be used after the protect/authMiddleware.
 * @param {...string} allowedRoles - List of authorized roles (e.g., 'admin', 'manager', 'operator')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'User authentication required.', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Permission denied. User role '${req.user.role}' is not authorized to access this resource.`,
        'FORBIDDEN',
        403
      );
    }

    next();
  };
};

export const authMiddleware = protect;
export default protect;
