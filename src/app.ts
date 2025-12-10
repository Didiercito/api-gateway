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

app.set("trust proxy", true);

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

app.get("/api/v1/inventory", (req, res) =>
  proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.get("/api/v1/inventory/categories", (req, res) =>
  proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.get("/api/v1/inventory/units", (req, res) =>
  proxyRequest(
    req,
    res,
    process.env.INVENTARY_SERVICE_URL!,
    "/api/v1/inventory/units"
  )
);

app.all(
  "/api/v1/inventory/*",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.INVENTARY_SERVICE_URL!)
);

app.all(
  "/api/v1/chef/*",
  authenticate,
  requireRole(["Admin_cocina", "Voluntario"]),
  (req, res) => {
    const targetPath = req.originalUrl.replace("/api/v1/chef", "");
    proxyRequest(req, res, process.env.CHEF_SERVICE_URL!, targetPath);
  }
);

app.get(
  "/api/v1/kitchens/nearby",
  resolveUserLocation,
  (req, res) =>
    proxyRequest(req, res, process.env.KITCHEN_SERVICE_URL!)
);

app.post(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.KITCHEN_SERVICE_URL!)
);

app.put(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.KITCHEN_SERVICE_URL!)
);

app.get(
  "/api/v1/kitchens/:kitchenId/schedule",
  authenticate,
  requireRole(["Admin_cocina"]),
  (req, res) =>
    proxyRequest(req, res, process.env.KITCHEN_SERVICE_URL!)
);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API Gateway OK"
  });
});

export default app;