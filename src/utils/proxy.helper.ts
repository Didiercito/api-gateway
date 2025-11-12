import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string,
  customPath?: string
): Promise<void> => {
  try {
    const finalPath = customPath ?? req.originalUrl;
    const finalUrl = `${targetUrl}${finalPath}`;
    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${finalUrl}`);

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: finalUrl,
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

    if (response.headers) {
      delete response.headers['content-length'];
      delete response.headers['transfer-encoding'];
    }

    Object.keys(response.headers).forEach((key) => {
      if (key.toLowerCase() !== 'access-control-allow-origin') {
        res.setHeader(key, response.headers[key]);
      }
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
