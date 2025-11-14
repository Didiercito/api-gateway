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

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimitMiddleware);

// ====================== SERVICES URL ======================
const AUTH = process.env.AUTH_USER_SERVICE_URL!;
const STATES = process.env.STATES_SERVICE_URL!;
const KITCHENS = process.env.KITCHEN_SERVICE_URL!;
const NOTIFICATIONS = process.env.NOTIFICATIONS_SERVICE_URL!;

// ====================== HEALTH ======================
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway OK",
    timestamp: new Date(),
    services: { AUTH, STATES, KITCHENS, NOTIFICATIONS }
  });
});

// ====================== AUTH SERVICE ======================
app.all("/api/v1/auth/*", (req, res) => {
  proxyRequest(req, res, AUTH);
});

app.all("/api/v1/users/*", (req, res) => {
  proxyRequest(req, res, AUTH);
});

// ====================== STATES ======================
app.all("/api/v1/states/*", (req, res) => {
  proxyRequest(req, res, STATES);
});

// ====================== NOTIFICATIONS ======================
app.all("/api/v1/notifications/*", (req, res) => {
  proxyRequest(req, res, NOTIFICATIONS);
});

// ====================== KITCHENS ======================
app.get("/api/v1/kitchens/nearby", resolveUserLocation, (req, res) => {
  proxyRequest(req, res, KITCHENS);
});

app.all("/api/v1/kitchens/*", (req, res) => {
  proxyRequest(req, res, KITCHENS);
});

export default app;
