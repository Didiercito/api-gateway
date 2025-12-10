import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";

import { proxyRequest } from "./utils/proxy.helper";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import { resolveUserLocation } from "./middleware/resolve-location.middleware";
import { authenticate } from "./middleware/auth.middleware";
import { requireRole } from "./middleware/role.middleware";

dotenv.config();

const app: Application = express();

app.use(cors({ origin: "*" }));
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
  "/api/v1/kitchens": process.env.KITCHEN_SERVICE_URL!,
  "/api/v1/payments": process.env.PAYMENTS_SERVICE_URL!,
  "/api/v1/events": process.env.EVENTS_SERVICE_URL!,
  "/api/v1/event-registrations": process.env.EVENTS_SERVICE_URL!,
  "/api/v1/event-subscriptions": process.env.EVENTS_SERVICE_URL!,

  "/api/v1/chef": process.env.CHEF_SERVICE_URL!
};

app.get("/api/v1/inventory", (req, res) =>
  proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.get("/api/v1/inventory/categories", (req, res) =>
  proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.get("/api/v1/inventory/units", (req, res) =>
  proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.all(
  "/api/v1/inventory/categories/*",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.all(
  "/api/v1/inventory/*",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.get("/api/v1/chef", (req, res) =>
  proxyRequest(req, res, process.env.CHEF_SERVICE_URL!)
);

app.all(
  "/api/v1/chef/*",
  authenticate,
  requireRole(["Admin_cocina", "Voluntario"]),
  (req, res) =>
    proxyRequest(req, res, process.env.CHEF_SERVICE_URL!)
);

app.get(
  "/api/v1/kitchens/nearby",
  resolveUserLocation,
  (req, res) =>
    proxyRequest(req, res, SERVICE_MAP["/api/v1/kitchens"])
);

app.post(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, SERVICE_MAP["/api/v1/kitchens"])
);

app.put(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, SERVICE_MAP["/api/v1/kitchens"])
);

app.get(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, SERVICE_MAP["/api/v1/kitchens"])
);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API Gateway OK"
  });
});

app.all("/api/v1/*", (req, res) => {
  const path = req.originalUrl;
  const prefix = Object.keys(SERVICE_MAP).find(p =>
    path.startsWith(p)
  );

  if (!prefix) {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path
    });
  }

  let targetPath = path;

  if (prefix === "/api/v1/states") {
    targetPath = path.replace("/v1", "");
  }

  return proxyRequest(req, res, SERVICE_MAP[prefix], targetPath);
});

export default app;