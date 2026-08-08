/**
 * Centralized 404 Route Not Found Middleware.
 * Catches unhandled routes and returns standard JSON error response.
 */
export const notFoundMiddleware = (req, res) => {
  const method = req.method;
  const url = req.originalUrl || req.url;

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${url}`,
    error: {
      code: 'ROUTE_NOT_FOUND',
    },
  });
};

export default notFoundMiddleware;
