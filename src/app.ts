import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { proxyRequest } from './utils/proxy.helper';

dotenv.config();

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      authUser: process.env.AUTH_USER_SERVICE_URL ? 'OK' : 'Not Set',
      states: process.env.STATES_SERVICE_URL ? 'OK' : 'Not Set',
      notifications: process.env.NOTIFICATIONS_SERVICE_URL ? 'OK' : 'Not Set',
    },
  });
});

const AUTH_USER_URL = process.env.AUTH_USER_SERVICE_URL!;
const authUserRoutes = [
  '/api/v1/auth/*',
  '/api/v1/password/*',
  '/api/v1/permission/*',
  '/api/v1/role/*',
  '/api/v1/verification/*',
  
  '/api/v1/users/*',
  '/api/v1/users',
  '/api/v1/skills/*',
  '/api/v1/skills',
  '/api/v1/availability/*',
  '/api/v1/availability',
  '/api/v1/schedules/*',
  '/api/v1/schedules',
  '/api/v1/reputation/*',
  '/api/v1/reputation',
];

authUserRoutes.forEach((route) => {
  app.all(route, (req, res) => proxyRequest(req, res, AUTH_USER_URL));
});

const STATES_URL = process.env.STATES_SERVICE_URL!;

app.all('/api/v1/states*', async (req: Request, res: Response) => {
  const newPath = req.path.replace('/api/v1/states', '/api/states');
  proxyRequest(req, res, STATES_URL, newPath);
});

const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL!;

app.all('/api/v1/notifications*', async (req: Request, res: Response) => {
  const newPath = req.path.replace('/api/v1/notifications', '/api/notifications');
  proxyRequest(req, res, NOTIFICATIONS_URL, newPath);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found on API Gateway',
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;