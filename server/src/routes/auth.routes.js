import express from 'express';
import {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected Authentication Endpoints
router.get('/me', protect, getMe);

export default router;
