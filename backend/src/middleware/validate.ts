import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/errors";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const detail = result.error.issues.map((i) => `${i.path.join(".") || source}: ${i.message}`).join("; ");
      return next(new AppError(400, `Invalid request: ${detail}`, "validation_error"));
    }
    if (source === "body") req.body = result.data;
    else Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    next();
  };
