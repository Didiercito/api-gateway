// api-gateway/src/app.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';
import { config } from 'dotenv';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';

config();

const app: Application = express();

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(rateLimitMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      user: process.env.USER_SERVICE_URL,
      states: process.env.STATES_SERVICE_URL
    }
  });
});

// ============================================
// PROXY ROUTES
// ============================================

// STATES SERVICE - ✅ CORREGIDO
app.use('/api/v1/states', proxy(process.env.STATES_SERVICE_URL || 'http://localhost:3001', {
  proxyReqPathResolver: (req) => {
    // Gateway recibe: /api/v1/states o /api/v1/states/7/municipalities
    // States espera: /api/states o /api/states/7/municipalities
    
    const originalUrl = req.url; // Puede ser: '' o '/7/municipalities'
    const basePath = '/api/states';
    const finalPath = basePath + originalUrl;
    
    console.log(`🔀 States Proxy:`);
    console.log(`   Original request: /api/v1/states${originalUrl}`);
    console.log(`   Final path: ${finalPath}`);
    
    return finalPath;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('❌ States Service Error:', err.message);
    res.status(502).json({
      success: false,
      message: 'States Service unavailable',
      error: err.message
    });
  }
}));

// AUTH SERVICE
app.use('/api/v1/auth', proxy(process.env.AUTH_SERVICE_URL || 'http://localhost:3002', {
  proxyReqPathResolver: (req) => {
    console.log(`🔀 Auth Proxy: ${req.url}`);
    return req.url;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('❌ Auth Service Error:', err.message);
    res.status(502).json({
      success: false,
      message: 'Auth Service unavailable',
      error: err.message
    });
  }
}));

// USER SERVICE
app.use('/api/v1/users', proxy(process.env.USER_SERVICE_URL || 'http://localhost:3003', {
  proxyReqPathResolver: (req) => {
    console.log(`🔀 User Proxy: ${req.url}`);
    return req.url;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('❌ User Service Error:', err.message);
    res.status(502).json({
      success: false,
      message: 'User Service unavailable',
      error: err.message
    });
  }
}));

// ============================================
// ERROR HANDLERS
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;