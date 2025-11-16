import axios, { AxiosRequestConfig } from "axios";
import { Request, Response } from "express";

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string,
  customPath?: string
): Promise<void> => {
  try {
    const pathToUse = customPath ?? req.originalUrl;
    const finalUrl = targetUrl + pathToUse;

    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${finalUrl}`);

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: finalUrl,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host,
      },
      params: req.query,
      data: req.body,
      timeout: 15000,
      validateStatus: () => true
    };

    delete config.headers!["content-length"];

    const response = await axios(config);

    res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error("🚨 [PROXY ERROR]", error?.message);

    res.status(503).json({
      success: false,
      message: "Service unavailable",
      error: error.message
    });
  }
};

