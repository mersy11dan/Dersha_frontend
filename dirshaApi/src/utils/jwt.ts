import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccountStatus =
  | "PENDING_KYC"
  | "ACTIVE_VERIFIED"
  | "SUSPENDED_FRAUD"
  | "FLAGGED_AML";

export interface JwtPayload {
  userId: string;
  email: string;
  accountStatus: AccountStatus;
  role: "INVESTOR" | "FUND_MANAGER" | "SYSTEM";
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
