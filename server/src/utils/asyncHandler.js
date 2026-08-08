/**
 * Express Async Handler Wrapper.
 * Wraps asynchronous Express route handlers and controller methods to automatically
 * catch rejected promises and forward them to the centralized error middleware via next().
 *
 * @param {Function} fn - Async Express route controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
