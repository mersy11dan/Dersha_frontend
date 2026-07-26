import { Request } from "express";

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

/** Extracts the client fingerprint recorded on every audit row. */
export function requestContext(req: Request): RequestContext {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ??
    req.ip ??
    req.socket.remoteAddress ??
    null;

  return {
    ipAddress: ipAddress ? ipAddress.trim() : null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}
