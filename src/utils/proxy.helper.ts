import axios, { AxiosRequestConfig } from "axios";
import { Request, Response } from "express";

export const proxyRequest = async (
  req: Request,
  res: Response,
  targetUrl: string
): Promise<void> => {
  try {
    const finalUrl = targetUrl + req.originalUrl;

    console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${finalUrl}`);

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: finalUrl,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host
      },
      params: req.query,
      data: req.body,
      timeout: 15000, // más seguro
      validateStatus: () => true
    };

    delete config.headers!["content-length"];
    delete config.headers!["content-type"];

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
