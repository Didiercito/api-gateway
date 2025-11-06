import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string
): Promise<void> => {
  try {
    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${targetUrl}${req.originalUrl}`);

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: `${targetUrl}${req.originalUrl}`,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host
      },
      data: req.body,
      params: req.query,
      timeout: 30000,
      validateStatus: () => true
    };

    // ✅ protección contra headers undefined
    if (config.headers) {
      delete (config.headers as any)['host'];
      delete (config.headers as any)['content-length'];
    }

    const response = await axios(config);

    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('[PROXY ERROR]', error.message);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: error.message
    });
  }
};
