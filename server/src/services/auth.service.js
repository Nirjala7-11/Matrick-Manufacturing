import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import env from '../config/env.js';
import { generateOTP, hashOTP, verifyOTP } from '../utils/otp.js';
import { sendPasswordResetEmail } from './email.service.js';

/**
 * Helper: Create standardized custom Error object
 */
const createError = (message, statusCode = 400, code = 'BAD_REQUEST') => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

/**
 * Generate JWT authentication token for a user
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Strip sensitive attributes to prepare safe user object for API response
 */
export const toSafeUser = (user) => {
  if (!user) return null;
  if (typeof user.toSafeObject === 'function') {
    return user.toSafeObject();
  }
  const rawObj = user.toObject ? user.toObject() : { ...user };
  delete rawObj.password;
  delete rawObj.otpHash;
  delete rawObj.__v;
  return rawObj;
};

/**
 * Hash a raw password string using bcrypt
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plaintext password against hashed password
 */
export const comparePassword = async (plaintext, hashed) => {
  return await bcrypt.compare(plaintext, hashed);
};

/**
 * Find user by ID without password or sensitive OTP fields
 */
export const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
};

/**
 * Find user by email address
 */
export const findUserByEmail = async (email) => {
  if (!email) throw createError('Email is required', 400, 'MISSING_EMAIL');
  const normalizedEmail = email.toLowerCase().trim();
  return await User.findOne({ email: normalizedEmail });
};

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    throw createError('Name, email, and password are required', 400, 'MISSING_FIELDS');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError('A user with this email address already exists', 409, 'USER_ALREADY_EXISTS');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password, // Handled by Mongoose pre-save hook
    role: role || 'operator',
  });

  const token = generateToken(user);
  return {
    user: toSafeUser(user),
    token,
  };
};

/**
 * Validate user credentials and login
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw createError('Email and password are required', 400, 'MISSING_CREDENTIALS');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = generateToken(user);
  return {
    user: toSafeUser(user),
    token,
  };
};

/**
 * Generate a 6-digit numeric OTP for password reset and store hashed representation
 */
export const generatePasswordResetOTP = async (email) => {
  if (!email) {
    throw createError('Email is required for password reset', 400, 'MISSING_EMAIL');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw createError('Email not registered', 404, 'USER_NOT_FOUND');
  }

  // Generate cryptographically secure 6-digit OTP string
  const rawOTP = generateOTP(6);
  const otpHashValue = hashOTP(rawOTP);

  // Set 15 minute expiration
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.otpHash = otpHashValue;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0;
  user.isOtpVerified = false;

  await user.save();

  // Dispatch email notification
  await sendPasswordResetEmail(normalizedEmail, rawOTP).catch(() => {
    // Suppress error if SMTP is unconfigured in development
  });

  return {
    email: normalizedEmail,
    rawOTP, // Returned to calling code (for email/dev display) - never saved in plaintext
    expiresAt: otpExpiresAt,
  };
};

/**
 * Verify submitted OTP against stored hash and check expiration
 */
export const verifyPasswordResetOTP = async (email, otp) => {
  if (!email || !otp) {
    throw createError('Email and OTP are required', 400, 'MISSING_OTP_FIELDS');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otpHash');

  if (!user) {
    throw createError('Email not registered', 404, 'USER_NOT_FOUND');
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    throw createError('No active password reset request found. Please request a new OTP.', 400, 'NO_ACTIVE_OTP');
  }

  // Check expiration
  if (new Date() > new Date(user.otpExpiresAt)) {
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.isOtpVerified = false;
    await user.save();
    throw createError('OTP has expired. Please request a new code.', 400, 'OTP_EXPIRED');
  }

  // Check attempt threshold (max 5 attempts)
  if (user.otpAttempts >= 5) {
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.isOtpVerified = false;
    await user.save();
    throw createError('Too many failed attempts. Please request a new OTP.', 429, 'MAX_OTP_ATTEMPTS_EXCEEDED');
  }

  const isValid = verifyOTP(otp, user.otpHash);
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();
    throw createError('Invalid verification code', 400, 'INVALID_OTP');
  }

  // Mark as verified
  user.isOtpVerified = true;
  await user.save();

  return {
    success: true,
    message: 'OTP verified successfully',
    email: normalizedEmail,
  };
};

/**
 * Reset password using verified OTP state
 */
export const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw createError('Email, OTP, and new password are required', 400, 'MISSING_RESET_FIELDS');
  }

  if (newPassword.length < 6) {
    throw createError('New password must be at least 6 characters long', 400, 'PASSWORD_TOO_SHORT');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+otpHash');

  if (!user) {
    throw createError('Email not registered', 404, 'USER_NOT_FOUND');
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    throw createError('No active password reset request found. Please request a new OTP.', 400, 'NO_ACTIVE_OTP');
  }

  if (new Date() > new Date(user.otpExpiresAt)) {
    throw createError('OTP has expired. Please request a new code.', 400, 'OTP_EXPIRED');
  }

  const isValid = verifyOTP(otp, user.otpHash);
  if (!isValid) {
    throw createError('Invalid verification code', 400, 'INVALID_OTP');
  }

  // Update password and clear OTP state
  user.password = newPassword; // Handled by Mongoose pre-save hook
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.isOtpVerified = false;

  await user.save();

  return {
    user: toSafeUser(user),
    message: 'Password reset successful. You may now log in with your new password.',
  };
};

export const authService = {
  generateToken,
  toSafeUser,
  hashPassword,
  comparePassword,
  findUserById,
  findUserByEmail,
  registerUser,
  loginUser,
  generatePasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
};

export default authService;
