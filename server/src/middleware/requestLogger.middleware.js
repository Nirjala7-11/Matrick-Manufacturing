import logger from '../config/logger.js';

/**
 * Lightweight Request Logging Middleware.
 * Logs HTTP method, path, response status code, and execution duration.
 * Strictly avoids logging sensitive headers, tokens, passwords, or request bodies.
 */
export const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, url } = req;
  const path = originalUrl || url;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logMessage = `${method} ${path} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(logMessage, { duration, statusCode });
    } else if (statusCode >= 400) {
      logger.warn(logMessage, { duration, statusCode });
    } else {
      logger.info(logMessage, { duration, statusCode });
    }
  });

  next();
};

export default requestLoggerMiddleware;
