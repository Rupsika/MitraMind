import { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = "error",
  ) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
