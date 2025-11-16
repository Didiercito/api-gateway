import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import { proxyRequest } from "./utils/proxy.helper";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import { resolveUserLocation } from "./middleware/resolve-location.middleware";

const app: Application = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

const SERVICE_MAP: Record<string, string> = {
  "/api/v1/auth": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/password": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/permission": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/role": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/verification": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/users": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/skills": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/availability": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/schedules": process.env.AUTH_USER_SERVICE_URL!,
  "/api/v1/reputation": process.env.AUTH_USER_SERVICE_URL!,

  "/api/v1/states": process.env.STATES_SERVICE_URL!,
  "/api/v1/notifications": process.env.NOTIFICATIONS_SERVICE_URL!,
  "/api/v1/kitchens": process.env.KITCHEN_SERVICE_URL!
};

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API Gateway OK" });
});

app.get("/api/v1/kitchens/nearby", resolveUserLocation, (req, res) => {
  proxyRequest(req, res, SERVICE_MAP["/api/v1/kitchens"]);
});

app.all("/api/v1/*", (req: Request, res: Response) => {
  const path = req.originalUrl;

  const prefix = Object.keys(SERVICE_MAP).find((p) =>
    path.startsWith(p)
  );

  if (!prefix) {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path
    });
  }

  return proxyRequest(req, res, SERVICE_MAP[prefix]);
});

export default app;
