/**
 * Error carrying an HTTP status and a stable machine-readable code, so the
 * frontend can branch on `code` instead of parsing human-readable messages.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code: string, message: string) {
    return new ApiError(401, code, message);
  }

  static forbidden(code: string, message: string) {
    return new ApiError(403, code, message);
  }

  static notFound(code: string, message: string) {
    return new ApiError(404, code, message);
  }

  static conflict(code: string, message: string, details?: unknown) {
    return new ApiError(409, code, message, details);
  }

  static unprocessable(code: string, message: string, details?: unknown) {
    return new ApiError(422, code, message, details);
  }

  static internal(code: string, message: string, details?: unknown) {
    return new ApiError(500, code, message, details);
  }

  static serviceUnavailable(code: string, message: string, details?: unknown) {
    return new ApiError(503, code, message, details);
  }
}
