import { createHash, randomUUID } from "node:crypto";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { recordAudit } from "../repository/AuditRepository";
import { ApiError } from "../utils/ApiError";
import { z } from "zod";

export const FundingSourceRequestSchema = z.object({
  source_type: z.enum(["BANK", "MOBILE_MONEY"], {
    error: "Choose whether this is a bank account or a mobile wallet",
  }),
  provider_code: z.enum(
    [
      "CBEETET",
      "AWABETET",
      "DASBETET",
      "WGBETET",
      "BOAETET",
      "TELEBIRR",
      "CBE_BIRR",
    ],
    { error: "Select a supported financial institution" },
  ),
  account_number: z
    .string({ error: "Account or wallet number is required" })
    .trim()
    .min(9, "Account number looks too short")
    .max(25, "Account number cannot exceed 25 characters")
    .regex(/^[0-9+]+$/, "Account number may only contain digits"),
  make_primary: z.boolean().default(true),
});

export type FundingSourceRequest = z.infer<typeof FundingSourceRequestSchema>;

const PROVIDER_NAMES: Record<string, string> = {
  CBEETET: "Commercial Bank of Ethiopia",
  AWABETET: "Awash Bank",
  DASBETET: "Dashen Bank",
  WGBETET: "Wegagen Bank",
  BOAETET: "Bank of Abyssinia",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
};

function maskAccount(accountNumber: string): string {
  const tail = accountNumber.slice(-4);
  return `${"•".repeat(Math.max(accountNumber.length - 4, 0))}${tail}`;
}

function hashAccount(accountNumber: string): string {
  return createHash("sha256").update(accountNumber).digest("hex");
}

export class FundingService {
  async list(userId: string) {
    const [rows]: any = await pool.execute(
      `SELECT funding_source_id, source_type, provider_code, provider_name,
              account_number_masked, is_primary, verified, created_at
       FROM linked_funding_sources
       WHERE user_id = ?
       ORDER BY is_primary DESC, created_at DESC`,
      [userId],
    );

    return rows.map((row: any) => ({
      ...row,
      is_primary: Boolean(row.is_primary),
      verified: Boolean(row.verified),
    }));
  }

  async link(userId: string, request: FundingSourceRequest) {
    const accountHash = hashAccount(request.account_number);

    const [existing]: any = await pool.execute(
      `SELECT funding_source_id FROM linked_funding_sources
       WHERE user_id = ? AND account_number_hash = ? LIMIT 1`,
      [userId, accountHash],
    );

    if (existing.length > 0) {
      throw ApiError.conflict(
        "FUNDING_SOURCE_ALREADY_LINKED",
        "This account is already linked to your profile.",
      );
    }

    const fundingSourceId = randomUUID();

    await withTransaction(async (connection) => {
      if (request.make_primary) {
        await connection.execute(
          `UPDATE linked_funding_sources SET is_primary = 0 WHERE user_id = ?`,
          [userId],
        );
      }

      await connection.execute(
        `INSERT INTO linked_funding_sources
           (funding_source_id, user_id, source_type, provider_code, provider_name,
            account_number_masked, account_number_hash, is_primary, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          fundingSourceId,
          userId,
          request.source_type,
          request.provider_code,
          PROVIDER_NAMES[request.provider_code] ?? request.provider_code,
          maskAccount(request.account_number),
          accountHash,
          request.make_primary ? 1 : 0,
        ],
      );

      await recordAudit(connection, {
        userId,
        category: "WALLET",
        eventType: "FUNDING_SOURCE_LINKED",
        referenceId: fundingSourceId,
        payload: {
          provider: request.provider_code,
          source_type: request.source_type,
          account_tail: request.account_number.slice(-4),
        },
      });
    });

    return {
      funding_source_id: fundingSourceId,
      provider_name: PROVIDER_NAMES[request.provider_code],
      account_number_masked: maskAccount(request.account_number),
      is_primary: request.make_primary,
      verified: true,
    };
  }
}

export const fundingService = new FundingService();
