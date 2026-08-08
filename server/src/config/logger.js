/**
 * Simple structured logger utility for the Manufacturing Management System.
 * Ensures consistent formatting, timestamping, log level categorization,
 * and safe masking of sensitive data (passwords, tokens, keys).
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Helper to sanitize objects before logging to prevent secret leakage
function sanitize(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return data.replace(/(password|token|secret|authorization|key)=["']?([^"'&\s]+)/gi, '$1=***REDACTED***');
  }
  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      if (/password|token|secret|authorization|key/i.test(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return data;
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
  return `[${timestamp}] [${level}] ${message}${metaString}`;
}

export const logger = {
  error: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
  warn: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  info: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, meta));
    }
  },
  debug: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
};

export default logger;
