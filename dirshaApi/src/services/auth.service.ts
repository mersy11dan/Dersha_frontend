import argon2 from "argon2";
import { PoolConnection } from "mysql2/promise";
import { withTransaction } from "../database/transactionManager";
import pool from "../database/database.config";
import { UserRepository } from "../repository/UserRepository";
import { recordAudit, recordAuditDetached } from "../repository/AuditRepository";
import {
  UserRegistrationRequest,
  UserLoginRequest,
  UserProfileResponse,
} from "../schemas/user.schema";
import { signToken, JwtPayload, AccountStatus } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

// OWASP-recommended Argon2id parameters.
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
} as const;

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthResult {
  token: string;
  user: UserProfileResponse;
}

/**
 * Guarantees the paired wallet exists.
 *
 * dirsha_db_v2.sql installs an AFTER INSERT trigger that provisions it, but a
 * database restored without the trigger would otherwise leave users unable to
 * transact, so this backstops it inside the same transaction.
 */
async function ensureWallet(
  connection: PoolConnection,
  userId: string,
): Promise<void> {
  const [rows]: any = await connection.execute(
    "SELECT wallet_id FROM wallets WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO wallets (user_id, available_balance_etb, escrowed_balance_etb, currency_code)
       VALUES (?, 0.0000, 0.0000, 'ETB')`,
      [userId],
    );
  }
}

export class UserAuthService {
  /**
   * Onboarding Step 1. Creates a PENDING_KYC account and its zero-balance
   * wallet in one transaction, then issues a token so the client can proceed
   * directly to identity verification.
   */
  async registerTempUser(
    userData: UserRegistrationRequest,
    context: RequestContext = {},
  ): Promise<AuthResult> {
    const passwordHash = await argon2.hash(
      userData.password_plain,
      ARGON2_OPTIONS,
    );

    const userId = await withTransaction(async (connection) => {
      const users = new UserRepository(connection);

      if (
        await users.identityExists(
          userData.email_address,
          userData.phone_number_eth,
        )
      ) {
        throw ApiError.conflict(
          "IDENTITY_ALREADY_REGISTERED",
          "An account with this email address or phone number already exists.",
        );
      }

      const result = await users.saveData({
        full_name_raw: userData.full_name_raw,
        email_address: userData.email_address,
        phone_number_eth: userData.phone_number_eth,
        is_diaspora_account: userData.is_diaspora_account,
        password_hash: passwordHash,
      });

      if (!result.success || !result.data) {
        throw ApiError.internal(
          "REGISTRATION_FAILED",
          "Could not create the account.",
          result.success ? undefined : result.error,
        );
      }

      await ensureWallet(connection, result.data);

      await recordAudit(connection, {
        userId: result.data,
        category: "AUTHENTICATION",
        eventType: "ACCOUNT_REGISTERED",
        referenceId: result.data,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: { is_diaspora_account: userData.is_diaspora_account },
      });

      return result.data;
    });

    const profile = await this.getProfile(userId);

    return {
      token: signToken({
        userId,
        email: profile.email_address,
        accountStatus: profile.account_status as AccountStatus,
        role: "INVESTOR",
      }),
      user: profile,
    };
  }

  async loginUser(
    credentials: UserLoginRequest,
    context: RequestContext = {},
  ): Promise<AuthResult> {
    const users = new UserRepository(pool);
    const record = await users.findCredentialsByEmail(credentials.email_address);

    // A single generic message for both "no such user" and "wrong password"
    // keeps the endpoint from confirming which emails are registered.
    const invalidCredentials = ApiError.unauthorized(
      "INVALID_CREDENTIALS",
      "The email address or password is incorrect.",
    );

    if (!record) throw invalidCredentials;

    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(
        record.password_hash,
        credentials.password_plain,
      );
    } catch {
      // System accounts carry a deliberately invalid hash, which makes
      // argon2.verify throw rather than return false.
      passwordMatches = false;
    }

    if (!passwordMatches) {
      await recordAuditDetached({
        userId: record.user_id,
        category: "AUTHENTICATION",
        eventType: "LOGIN_FAILED",
        severity: "WARNING",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw invalidCredentials;
    }

    if (record.account_status === "SUSPENDED_FRAUD" || record.account_status === "FLAGGED_AML") {
      await recordAuditDetached({
        userId: record.user_id,
        category: "AUTHENTICATION",
        eventType: "LOGIN_BLOCKED_RESTRICTED_ACCOUNT",
        severity: "CRITICAL",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw ApiError.forbidden(
        "ACCOUNT_RESTRICTED",
        "This account has been restricted. Please contact support.",
      );
    }

    const profile = await this.getProfile(record.user_id);
    const role = await this.resolveRole(record.user_id);

    if (role === "SYSTEM") {
      throw invalidCredentials;
    }

    await recordAuditDetached({
      userId: record.user_id,
      category: "AUTHENTICATION",
      eventType: "LOGIN_SUCCEEDED",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      token: signToken({
        userId: record.user_id,
        email: profile.email_address,
        accountStatus: profile.account_status as AccountStatus,
        role,
      }),
      user: profile,
    };
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const users = new UserRepository(pool);
    const result = await users.findById(userId);

    if (!result.success || !result.data) {
      throw ApiError.notFound("USER_NOT_FOUND", "This account no longer exists.");
    }

    return {
      ...result.data,
      is_diaspora_account: Boolean(result.data.is_diaspora_account),
    };
  }

  async resolveRole(
    userId: string,
  ): Promise<"INVESTOR" | "FUND_MANAGER" | "SYSTEM"> {
    const [rows]: any = await pool.execute(
      "SELECT role FROM users WHERE user_id = ? LIMIT 1",
      [userId],
    );
    return rows[0]?.role ?? "INVESTOR";
  }
}

export const userAuthService = new UserAuthService();
