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
    const finalUrl = `${targetUrl}${finalPath}`;

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: finalUrl,
      headers: {
        ...req.headers,
        Authorization: req.headers.authorization || "",
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

    Object.keys(response.headers).forEach((key) => {
      res.setHeader(key, response.headers[key]);
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      error: error.message,
    });
  }
};