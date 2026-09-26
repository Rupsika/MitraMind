import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

/** Logs request metadata only: never bodies, headers, or query strings. */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  req.requestId = randomUUID().slice(0, 12);
  res.setHeader("x-request-id", req.requestId);
  res.on("finish", () => {
    logger.info("request", {
      requestId: req.requestId,
      endpoint: req.baseUrl + req.path,
      method: req.method,
      status: res.statusCode,
      latencyMs: Number((process.hrtime.bigint() - start) / 1_000_000n),
    });
  });
  next();
}
