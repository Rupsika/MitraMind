import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Repo-root .env first, then backend-local override.
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
  dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true, quiet: true });
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default(""),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Deployed frontend origin(s), comma-separated; added to the CORS allow-list.
  FRONTEND_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Print variable names only, never values.
  const names = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${names}`);
}

export const env = parsed.data;
