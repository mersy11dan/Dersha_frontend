import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

export type { JwtPayload };

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized(
      "AUTH_HEADER_MISSING",
      "Authorization header is missing.",
    );
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized(
      "AUTH_HEADER_MALFORMED",
      "Authorization header must use the Bearer scheme.",
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw ApiError.unauthorized(
      "AUTH_TOKEN_MISSING",
      "Access token is missing.",
    );
  }

  return token;
}

/**
 * Verifies the bearer token and attaches the payload to the request.
 *
 * Accepts PENDING_KYC accounts, because onboarding Step 2 (Fayda verification)
 * has to be reachable before the account is verified.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    req.user = verifyToken(extractBearerToken(req));
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        ApiError.unauthorized("TOKEN_EXPIRED", "Your session has expired."),
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        ApiError.unauthorized("TOKEN_INVALID", "Invalid access token."),
      );
    }
    next(error);
  }
};

/** Alias kept for the onboarding routes, where the account is still PENDING_KYC. */
export const authenticateTempUser = authenticate;

/**
 * Requires a completed Fayda eKYC. Guards every money-moving and
 * market-participating route.
 */
export const requireVerifiedAccount = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const user = req.user;

  if (!user) {
    return next(
      ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required."),
    );
  }

  if (user.accountStatus === "ACTIVE_VERIFIED") {
    return next();
  }

  if (user.accountStatus === "PENDING_KYC") {
    return next(
      ApiError.forbidden(
        "KYC_REQUIRED",
        "Complete Fayda identity verification to use this feature.",
      ),
    );
  }

  next(
    ApiError.forbidden(
      "ACCOUNT_RESTRICTED",
      "This account is restricted and cannot transact. Contact support.",
    ),
  );
};

/** Restricts fund-manager operations such as asset minting and yield runs. */
export const requireFundManager = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "FUND_MANAGER") {
    return next(
      ApiError.forbidden(
        "FUND_MANAGER_ONLY",
        "This operation is restricted to licensed fund manager accounts.",
      ),
    );
  }
  next();
};

/** Composed guard: authenticated AND verified. */
export const authenticateUserFayda = [authenticate, requireVerifiedAccount];
