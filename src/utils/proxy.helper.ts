import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string,
  customPath?: string
): Promise<void> => {
  try {
    const path = customPath !== undefined ? customPath : req.path;

    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${targetUrl}${path}`);

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: `${targetUrl}${path}`,
      params: req.query,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host,
        'x-forwarded-for': req.ip,
      },
      data: req.body,
      timeout: 30000,
      validateStatus: () => true,
    };

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
      error: error.message,
    });
  }
};