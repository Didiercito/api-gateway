import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ClientRequest } from 'http';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';

const app: Application = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/auth': '/api/v1/auth'
  },
  on: {
    proxyReq: (_proxyReq: ClientRequest, req: Request, _res: Response) => {
      console.log(`[PROXY] ${req.method} ${req.url} → ${process.env.AUTH_USER_SERVICE_URL}`);
    }
  }
}));

app.use('/api/v1/users', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/users': '/api/users'
  }
}));

app.use('/api/v1/skills', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/skills': '/api/skills'
  }
}));

app.use('/api/v1/availability', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/availability': '/api/availability'
  }
}));

app.use('/api/v1/schedules', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/schedules': '/api/schedules'
  }
}));

app.use('/api/v1/reputation', createProxyMiddleware({
  target: process.env.AUTH_USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/reputation': '/api/reputation'
  }
}));

app.use('/api/v1/states', createProxyMiddleware({
  target: process.env.STATES_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/states': '/api/v1/states'
  }
}));

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;