import { Request } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { env } from "../config/env";
import { getRedis } from "../services/redis";

function limiter(prefix: string, windowMs: number, max: number, keyByUser = false) {
  const redis = getRedis();
  return rateLimit({
    windowMs,
    limit: env.NODE_ENV === "test" ? 10_000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => (keyByUser && req.userId ? `u:${req.userId}` : req.ip || "unknown"),
    validate: { keyGeneratorIpFallback: false },
    message: { error: { code: "rate_limited", message: "Too many requests, please slow down." } },
    ...(redis
      ? { store: new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as never }) }
      : {}),
  });
}

export const globalLimiter = () => limiter("global", 15 * 60 * 1000, 300);
export const authLimiter = () => limiter("auth", 15 * 60 * 1000, 20);
export const aiLimiter = () => limiter("ai", 60 * 1000, 20, true);
