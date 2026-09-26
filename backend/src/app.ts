import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimit";
import { requestLogger } from "./middleware/requestLogger";
import { buildRouter } from "./routes";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()) }));
  app.use(requestLogger);
  app.use(globalLimiter());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "mitramind-backend" }));
  app.use("/api/v1", buildRouter());

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
