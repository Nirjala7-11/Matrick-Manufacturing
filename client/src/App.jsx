import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import axios from './api/axios';
import { endpoints } from './api/endpoints';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';

/**
 * Global Authentication Context
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider Component
 * Manages JWT tokens, axios Authorization headers, and user profile state.
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('mms_token') ||
      localStorage.getItem('token') ||
      null
    );
  });

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure global Axios Request Interceptor for Bearer JWT token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  /**
   * Fetch authenticated user profile via GET /api/auth/me
   */
  const checkAuth = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.get(endpoints.auth.me);
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (err) {
      console.warn('[AuthProvider] Auth session expired or invalid:', err?.message);
      // Clear invalid token
      localStorage.removeItem('mms_token');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * User Login action
   */
  const login = async (email, password) => {
    const res = await axios.post(endpoints.auth.login, { email, password });
    if (res.data?.success && res.data?.data?.token) {
      const newToken = res.data.data.token;
      const newUser = res.data.data.user;

      localStorage.setItem('mms_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    } else {
      throw new Error(res.data?.message || 'Login failed');
    }
  };

  /**
   * User Registration action
   */
  const register = async ({ name, email, password, role }) => {
    const res = await axios.post(endpoints.auth.register, {
      name,
      email,
      password,
      role,
    });
    if (res.data?.success && res.data?.data?.token) {
      const newToken = res.data.data.token;
      const newUser = res.data.data.user;

      localStorage.setItem('mms_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    } else {
      throw new Error(res.data?.message || 'Registration failed');
    }
  };

  /**
   * User Logout action
   */
  const logout = useCallback(() => {
    localStorage.removeItem('mms_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Inner App Consumer rendering SocketProvider & AppRoutes
 */
const AppContent = () => {
  const { isAuthenticated, isLoading, user, token, login, register, logout } =
    useAuth();

  return (
    <SocketProvider token={token}>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        user={user}
        onLogin={login}
        onRegister={register}
        onLogout={logout}
      />
    </SocketProvider>
  );
};

/**
 * Main App Root Component
 */
export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
