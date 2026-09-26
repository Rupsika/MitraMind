import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "Not found", "not_found"));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  const e = err as { type?: string; status?: number };
  if (e?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "bad_json", message: "Malformed JSON body" } });
  }
  logger.error("unhandled_error", { requestId: req.requestId, name: (err as Error)?.name });
  res.status(500).json({ error: { code: "internal_error", message: "Something went wrong" } });
}
