import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';

// Layouts & Route Guards
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import LoadingScreen from '../components/common/LoadingScreen';
import NotFound from '../components/common/NotFound';
import { ROLES } from '../config/roles';

// Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import Products from '../pages/Products/Products';
import ProductForm from '../pages/Products/ProductForm';
import ProductDetails from '../pages/Products/ProductDetails';
import WorkCenters from '../pages/WorkCenters/WorkCenters';
import WorkCenterForm from '../pages/WorkCenters/WorkCenterForm';
import WorkCenterDetails from '../pages/WorkCenters/WorkCenterDetails';
import BOMs from '../pages/BOMs/BOMs';
import BOMForm from '../pages/BOMs/BOMForm';
import BOMDetails from '../pages/BOMs/BOMDetails';
import ManufacturingOrders from '../pages/ManufacturingOrders/ManufacturingOrders';
import ManufacturingOrderForm from '../pages/ManufacturingOrders/ManufacturingOrderForm';
import ManufacturingOrderDetails from '../pages/ManufacturingOrders/ManufacturingOrderDetails';
import WorkOrders from '../pages/WorkOrders/WorkOrders';
import WorkOrderDetails from '../pages/WorkOrders/WorkOrderDetails';
import WorkOrderExecution from '../pages/WorkOrders/WorkOrderExecution';
import Inventory from '../pages/Inventory/Inventory';
import StockDetails from '../pages/Inventory/StockDetails';
import Analytics from '../pages/Analytics/Analytics';
import Reports from '../pages/Reports/Reports';
import ReportViewer from '../pages/Reports/ReportViewer';
import QualityDashboard from '../pages/Quality/QualityDashboard';
import MaintenanceDashboard from '../pages/Maintenance/MaintenanceDashboard';

import { LogIn, UserPlus, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import axios from '../api/axios';
import endpoints from '../api/endpoints';

/**
 * LoginForm Component for /login
 */
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await onLogin(email, password);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Invalid authentication credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Sign In to Matrick ERP</h2>
        <p className="text-xs text-slate-500">
          Enter your authorized credentials to access shop floor operations.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Forgot code?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <span>Authenticating...</span>
        ) : (
          <>
            <span>Authenticate Session</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register new account
          </Link>
        </p>
      </div>
    </form>
  );
};

/**
 * RegisterForm Component for /register
 */
const RegisterForm = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.OPERATOR);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await onRegister({ name, email, password, role });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to register account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Register Account</h2>
        <p className="text-xs text-slate-500">
          Create a new user account for manufacturing portal access.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Minimum 6 characters"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Role Access Assignment
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          >
            <option value={ROLES.OPERATOR}>Shop Floor Operator</option>
            <option value={ROLES.QUALITY_INSPECTOR}>Quality Inspector</option>
            <option value={ROLES.MANAGER}>Plant Manager</option>
            <option value={ROLES.ADMIN}>System Administrator</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <span>Creating Account...</span>
        ) : (
          <>
            <span>Create Account</span>
            <UserPlus className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
};

/**
 * ForgotPasswordForm Component for /forgot-password
 */
const ForgotPasswordForm = () => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmailFormat = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  // Step 1: Request OTP for registered user email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmailFormat(trimmedEmail)) {
      setError('Please enter a valid email address format (e.g. user@domain.com).');
      return;
    }
    setLoading(true);

    try {
      await axios.post(endpoints.auth.forgotPassword, { email: trimmedEmail });
      setStep('OTP');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Email not registered';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    if (!otp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);

    try {
      await axios.post(endpoints.auth.verifyOTP, { email, otp });
      setStep('NEW_PASSWORD');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Invalid verification code.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(endpoints.auth.resetPassword, { email, otp, newPassword });
      setStep('SUCCESS');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Failed to reset password.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-xs text-slate-500">
          {step === 'EMAIL' && 'Enter your registered email address to receive an OTP code.'}
          {step === 'OTP' && `Enter the 6-digit code sent to ${email}`}
          {step === 'NEW_PASSWORD' && 'Set a new secure password for your account.'}
          {step === 'SUCCESS' && 'Your password has been successfully updated.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* STEP 1: Enter Registered Email */}
      {step === 'EMAIL' && (
        <form onSubmit={handleRequestOTP} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating user...</span>
            ) : (
              <>
                <span>Send OTP to Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* STEP 2: Enter OTP Code */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOTP} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="123456"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <span>Verifying code...</span> : <span>Verify OTP Code</span>}
          </button>

          <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStep('EMAIL');
                setError(null);
              }}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Change Email
            </button>
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* STEP 3: Enter New Password */}
      {step === 'NEW_PASSWORD' && (
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Re-enter New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <span>Submitting...</span> : <span>Submit</span>}
          </button>
        </form>
      )}

      {/* STEP 4: Success Message */}
      {step === 'SUCCESS' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-3 text-center">
          <p className="font-bold text-sm">Password Reset Successful!</p>
          <p>You can now sign in using your new password.</p>
          <Link
            to="/login"
            className="inline-block py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all"
          >
            Proceed to Sign In
          </Link>
        </div>
      )}
    </div>
  );
};

/**
 * Main AppRoutes Definition
 */
export const AppRoutes = ({
  isAuthenticated,
  isLoading,
  user,
  onLogin,
  onRegister,
  onLogout,
}) => {
  if (isLoading) {
    return <LoadingScreen message="Initializing Matrick Manufacturing Portal..." />;
  }

  const userRole = user?.role || ROLES.OPERATOR;

  return (
    <Routes>
      {/* PUBLIC AUTH ROUTES (Wrapped in AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginForm onLogin={onLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterForm onRegister={onRegister} />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ForgotPasswordForm />
            )
          }
        />
      </Route>

      {/* PROTECTED AUTHENTICATED ROUTES (Wrapped in ProtectedRoute & MainLayout) */}
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            user={user}
          >
            <MainLayout user={user} onLogout={onLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* PRODUCTS MODULE */}
        <Route path="/products" element={<Products />} />
        <Route
          path="/products/new"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <ProductForm />
            </RoleBasedRoute>
          }
        />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route
          path="/products/:id/edit"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <ProductForm />
            </RoleBasedRoute>
          }
        />

        {/* WORK CENTERS MODULE */}
        <Route path="/work-centers" element={<WorkCenters />} />
        <Route
          path="/work-centers/new"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <WorkCenterForm />
            </RoleBasedRoute>
          }
        />
        <Route path="/work-centers/:id" element={<WorkCenterDetails />} />
        <Route
          path="/work-centers/:id/edit"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <WorkCenterForm />
            </RoleBasedRoute>
          }
        />

        {/* BOMS MODULE */}
        <Route path="/boms" element={<BOMs />} />
        <Route
          path="/boms/new"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <BOMForm />
            </RoleBasedRoute>
          }
        />
        <Route path="/boms/:id" element={<BOMDetails />} />
        <Route
          path="/boms/:id/edit"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <BOMForm />
            </RoleBasedRoute>
          }
        />

        {/* MANUFACTURING ORDERS MODULE */}
        <Route path="/manufacturing-orders" element={<ManufacturingOrders />} />
        <Route
          path="/manufacturing-orders/new"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <ManufacturingOrderForm />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/manufacturing-orders/:id"
          element={<ManufacturingOrderDetails />}
        />

        {/* WORK ORDERS MODULE */}
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetails />} />
        <Route
          path="/work-orders/:id/execution"
          element={<WorkOrderExecution />}
        />

        {/* INVENTORY MODULE */}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/stock/:productId" element={<StockDetails />} />

        {/* ANALYTICS MODULE */}
        <Route
          path="/analytics"
          element={
            <RoleBasedRoute
              userRole={userRole}
              allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}
            >
              <Analytics />
            </RoleBasedRoute>
          }
        />

        {/* REPORTS MODULE */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportViewer />} />

        {/* ENTERPRISE MODULES */}
        <Route path="/quality" element={<QualityDashboard />} />
        <Route path="/maintenance" element={<MaintenanceDashboard />} />
      </Route>

      {/* FALLBACK 404 ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
