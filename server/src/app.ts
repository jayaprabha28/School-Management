import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import navigationRoutes from "./modules/navigation/navigation.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import entityRoutes from "./modules/entities/entity.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin === "*" ? true : env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestId);

  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "svconnect", time: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/navigation", navigationRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/entities", entityRoutes);
  app.use("/api/settings", settingsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
