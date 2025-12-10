import axios, { AxiosRequestConfig } from "axios";
import { Request, Response } from "express";

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string,
  customPath?: string
): Promise<void> => {
  try {
    const finalPath = customPath ?? req.originalUrl;
    const normalizedPath = finalPath.startsWith("/")
      ? finalPath
      : `/${finalPath}`;

    const finalUrl = `${targetUrl}${normalizedPath}`;

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: finalUrl,
      headers: {
        ...req.headers,
      },
      params: req.query,
      data: req.body,
      timeout: 30000,
      validateStatus: () => true,
    };

    if (config.headers) {
      delete (config.headers as any)["host"];
      delete (config.headers as any)["content-length"];
      delete (config.headers as any)["transfer-encoding"];
    }

    const response = await axios(config);

    if (response.headers) {
      delete response.headers["content-length"];
      delete response.headers["transfer-encoding"];
    }

    Object.entries(response.headers || {}).forEach(([key, value]) => {
      if (value !== undefined) res.setHeader(key, value);
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);

    res.status(503).json({
      success: false,
      message: "Service unavailable",
      error: error.message,
    });
  }
};
