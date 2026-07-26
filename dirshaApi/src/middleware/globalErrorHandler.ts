import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

/** Maps MySQL driver errors onto meaningful HTTP responses. */
function translateDatabaseError(err: any): ApiError | null {
  switch (err?.code) {
    case "ER_DUP_ENTRY":
      return ApiError.conflict(
        "DUPLICATE_RECORD",
        "A record with these details already exists.",
      );
    case "ER_NO_REFERENCED_ROW":
    case "ER_NO_REFERENCED_ROW_2":
      return ApiError.badRequest(
        "INVALID_REFERENCE",
        "The request references a record that does not exist.",
      );
    case "ER_LOCK_DEADLOCK":
      return ApiError.serviceUnavailable(
        "LEDGER_CONTENTION",
        "The ledger is busy. Please retry this operation.",
      );
    case "ECONNREFUSED":
    case "PROTOCOL_CONNECTION_LOST":
      return ApiError.serviceUnavailable(
        "DATABASE_UNAVAILABLE",
        "The database is unavailable. Please try again shortly.",
      );
    default:
      return null;
  }
}

export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!err) return next();

  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message: "Some of the submitted values are invalid.",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const apiError = err instanceof ApiError ? err : translateDatabaseError(err);

  if (apiError) {
    if (apiError.statusCode >= 500) console.error(err);
    res.status(apiError.statusCode).json({
      success: false,
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    // Stack traces are development-only; production clients get the code alone.
    ...(env.nodeEnv === "development" ? { debug: String(err?.message ?? err) } : {}),
  });
}
