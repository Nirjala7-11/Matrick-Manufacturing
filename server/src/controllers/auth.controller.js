import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import authService from '../services/auth.service.js';
import env from '../config/env.js';

/**
 * Register a new user account.
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'Name, email, and password are required', 'MISSING_FIELDS', 400);
  }

  const result = await authService.registerUser({ name, email, password, role });

  return sendSuccess(
    res,
    'User registered successfully',
    {
      user: result.user,
      token: result.token,
    },
    201
  );
});

/**
 * Authenticate user and issue JWT token.
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 'MISSING_CREDENTIALS', 400);
  }

  const result = await authService.loginUser({ email, password });

  return sendSuccess(
    res,
    'Login successful',
    {
      user: result.user,
      token: result.token,
    },
    200
  );
});

/**
 * Request a password reset OTP sent to user email.
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email address is required', 'MISSING_EMAIL', 400);
  }

  const result = await authService.generatePasswordResetOTP(email);

  const responseData = {
    email: result.email,
    expiresAt: result.expiresAt,
  };

  return sendSuccess(
    res,
    'If an account with that email exists, a password reset code has been sent to your email.',
    responseData,
    200
  );
});

/**
 * Verify submitted password reset OTP.
 * POST /api/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 'Email and OTP code are required', 'MISSING_OTP_FIELDS', 400);
  }

  const result = await authService.verifyPasswordResetOTP(email, otp);

  return sendSuccess(res, result.message || 'OTP verified successfully', { email: result.email }, 200);
});

/**
 * Reset password using verified OTP.
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return sendError(res, 'Email, OTP, and new password are required', 'MISSING_RESET_FIELDS', 400);
  }

  const result = await authService.resetPassword(email, otp, newPassword);

  return sendSuccess(res, result.message || 'Password reset successfully', { user: result.user }, 200);
});

/**
 * Get profile of currently authenticated user.
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const safeUser = authService.toSafeUser(req.user);

  return sendSuccess(res, 'User profile retrieved successfully', { user: safeUser }, 200);
});

export const authController = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
};

export default authController;
