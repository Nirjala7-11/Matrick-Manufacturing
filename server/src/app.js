import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './config/env.js';
import logger from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import workCenterRoutes from './routes/workCenter.routes.js';
import bomRoutes from './routes/bom.routes.js';
import manufacturingOrderRoutes from './routes/manufacturingOrder.routes.js';
import workOrderRoutes from './routes/workOrder.routes.js';
import stockLedgerRoutes from './routes/stockLedger.routes.js';
import manufacturingWorkflowRoutes from './routes/manufacturingWorkflow.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

// Trust reverse proxy header (Cloud Run / nginx / load balancer)
app.set('trust proxy', 1);

// Secure CORS configuration suitable for React frontend
const allowedOrigins = [env.APP_URL, 'http://localhost:3000', 'http://0.0.0.0:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || !env.IS_PRODUCTION) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/container environment
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.IS_PRODUCTION ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

app.use('/api', apiLimiter);

// Structured Request Logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Manufacturing Management System API is healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/work-centers', workCenterRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/manufacturing-orders', manufacturingOrderRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/stock-ledger', stockLedgerRoutes);
app.use('/api/manufacturing-workflow', manufacturingWorkflowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Centralized 404 Handler for Unmatched API Endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find API endpoint ${req.originalUrl} on this server.`,
  });
});

// Centralized Error-Handling Middleware
app.use((err, _req, res, _next) => {
  logger.error('Unhandled Application Error:', { message: err.message, stack: err.stack });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(!env.IS_PRODUCTION && { stack: err.stack }),
  });
});

export default app;
