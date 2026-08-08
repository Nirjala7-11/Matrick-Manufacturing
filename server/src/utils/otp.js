import crypto from 'crypto';
import env from '../config/env.js';

/**
 * Generates a cryptographically secure numeric OTP string of given length (default 6).
 * Uses Node.js crypto module instead of Math.random().
 * @param {number} length - Number of digits (default 6)
 * @returns {string} - Generated numeric OTP string
 */
export const generateOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

/**
 * Computes a secure HMAC-SHA256 hash of an OTP string using the configured OTP_SECRET_KEY.
 * @param {string} otp - Raw OTP string
 * @returns {string} - Hex-encoded hash
 */
export const hashOTP = (otp) => {
  if (!otp) return '';
  return crypto
    .createHmac('sha256', env.OTP_SECRET_KEY || 'default_otp_secret_key')
    .update(String(otp).trim())
    .digest('hex');
};

/**
 * Verifies a candidate raw OTP against a stored hash using timing-safe comparison.
 * @param {string} candidateOtp - Plaintext OTP provided by user
 * @param {string} storedHash - Previously hashed OTP stored in database
 * @returns {boolean} - True if match, false otherwise
 */
export const verifyOTP = (candidateOtp, storedHash) => {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = hashOTP(candidateOtp);

  const bufA = Buffer.from(candidateHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export const otpUtils = {
  generateOTP,
  hashOTP,
  verifyOTP,
};

export default otpUtils;
