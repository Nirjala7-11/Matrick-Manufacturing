import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded
dotenv.config();

/**
 * Validates and exports strongly-typed, safely-defaulted environment configuration.
 * Fails fast on critical errors in production while providing safe development defaults.
 */

const isProduction = process.env.NODE_ENV === 'production';

// Critical environment variable validations
if (isProduction && !process.env.JWT_SECRET) {
  console.error('[ENV FATAL] JWT_SECRET must be defined in production mode.');
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: isProduction,
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/manufacturing_db',

  // Auth & Security
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_jwt_secret_key_12345!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OTP_SECRET_KEY: process.env.OTP_SECRET_KEY || 'fallback_otp_secret_key_12345',

  // SMTP Email Settings for OTP
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@manufacturing-app.com',

  // AI Integration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Storage & Reports
  REPORTS_TEMP_DIR: process.env.REPORTS_TEMP_DIR || path.join(process.cwd(), 'storage/reports/tmp'),
  EXPORT_MAX_ROWS: parseInt(process.env.EXPORT_MAX_ROWS || '10000', 10),
};

/**
 * Logs environment setup without revealing sensitive credentials.
 */
export function logEnvSummary() {
  console.log('[ENV Config] Initialized with options:');
  console.log(`  - Environment : ${env.NODE_ENV}`);
  console.log(`  - Port        : ${env.PORT}`);
  console.log(`  - App URL     : ${env.APP_URL}`);
  console.log(`  - MongoDB URI : ${env.MONGODB_URI.replace(/\/\/(.*?)@/, '//***:***@')}`);
  console.log(`  - JWT Auth    : Configured (Expires in: ${env.JWT_EXPIRES_IN})`);
  console.log(`  - SMTP Config : ${env.SMTP_USER ? `Configured (${env.SMTP_HOST})` : 'Not configured'}`);
}

export default env;
