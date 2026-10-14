import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  const maybe = err as { name?: string; message?: string; code?: number };
  if (maybe?.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", details: maybe.message });
  }
  if (maybe?.name === "CastError") {
    return res.status(400).json({ error: "Invalid identifier" });
  }
  if (maybe?.code === 11000) {
    return res.status(409).json({ error: "Duplicate value" });
  }
  console.error("[error]", err);
  return res.status(500).json({ error: "Internal server error" });
}
