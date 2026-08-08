/**
 * Standardized API Response Helper Utility.
 * Provides consistent response structures across all controller endpoints.
 */

/**
 * Sends a standardized successful JSON response.
 * @param {Object} res - Express response object
 * @param {string} [message='Operation successful'] - Success message
 * @param {Object|Array|null} [data=null] - Payload data
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object|null} [meta=null] - Optional metadata (e.g. pagination info)
 */
export const sendSuccess = (res, message = 'Operation successful', data = null, statusCode = 200, meta = null) => {
  const responsePayload = {
    success: true,
    message,
    ...(data !== null && data !== undefined && { data }),
    ...(meta !== null && meta !== undefined && { meta }),
  };

  return res.status(statusCode).json(responsePayload);
};

/**
 * Sends a standardized error JSON response.
 * @param {Object} res - Express response object
 * @param {string} [message='An error occurred'] - Error message
 * @param {Object|string|null} [error=null] - Error details or error code
 * @param {number} [statusCode=400] - HTTP status code
 */
export const sendError = (res, message = 'An error occurred', error = null, statusCode = 400) => {
  const responsePayload = {
    success: false,
    message,
    ...(error !== null && error !== undefined && {
      error: typeof error === 'string' ? { code: error } : error,
    }),
  };

  return res.status(statusCode).json(responsePayload);
};

export const apiResponse = {
  success: sendSuccess,
  error: sendError,
};

export default apiResponse;
