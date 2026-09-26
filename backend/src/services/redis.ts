import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let client: Redis | null = null;

/** Returns a shared Redis client, or null when REDIS_URL is not configured. */
export function getRedis(): Redis | null {
  if (!env.REDIS_URL || env.NODE_ENV === "test") return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false });
    client.on("error", () => logger.warn("redis_error"));
  }
  return client;
}

export async function cacheGetOrSet<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      /* fall through to load */
    }
  }
  const value = await load();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      /* cache is best-effort */
    }
  }
  return value;
}
