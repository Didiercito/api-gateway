import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios, { AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { proxyRequest } from './utils/proxy.helper';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      authUser: process.env.AUTH_USER_SERVICE_URL,
      states: process.env.STATES_SERVICE_URL,
    },
  });
});

const AUTH_USER_URL = process.env.AUTH_USER_SERVICE_URL!;

[
  '/api/v1/auth/*',
  '/api/v1/password/*',
  '/api/v1/permission/*',
  '/api/v1/role/*',
  '/api/v1/verification/*',
  '/api/users/*',
  '/api/users',
  '/api/skills/*',
  '/api/skills',
  '/api/availability/*',
  '/api/availability',
  '/api/schedules/*',
  '/api/schedules',
  '/api/reputation/*',
  '/api/reputation',
].forEach((route) => {
  app.all(route, (req, res) => proxyRequest(req, res, AUTH_USER_URL));
});

const STATES_URL = process.env.STATES_SERVICE_URL!;

app.all('/api/v1/states*', async (req: Request, res: Response) => {
  const originalUrl = req.originalUrl;
  const newPath = originalUrl.replace('/api/v1/states', '/api/states');

  console.log(`[PROXY STATES] ${req.method} ${originalUrl} → ${STATES_URL}${newPath}`);

  try {
    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: `${STATES_URL}${newPath}`,
      headers: {
        ...(req.headers as Record<string, any>),
        host: new URL(STATES_URL).host,
      },
      data: req.body,
      params: req.query,
      timeout: 30000,
      validateStatus: () => true,
    };

    Reflect.deleteProperty(config.headers!, 'host');
    Reflect.deleteProperty(config.headers!, 'content-length');

    const response = await axios(config);

    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value as string);
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('[PROXY STATES ERROR]', error.message);
    res.status(503).json({
      success: false,
      message: 'States service unavailable',
      error: error.message,
    });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
