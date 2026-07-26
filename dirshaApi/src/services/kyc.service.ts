import { withTransaction } from "../database/transactionManager";
import pool from "../database/database.config";
import { UserRepository } from "../repository/UserRepository";
import {
  recordAudit,
  recordAuditDetached,
} from "../repository/AuditRepository";
import { FaydaKYCRequest, UserProfileResponse } from "../schemas/user.schema";
import { ApiError } from "../utils/ApiError";
import { signToken, AccountStatus } from "../utils/jwt";
import {
  faydaAdapter,
  maskFaydaId,
  faydaIdHash,
  biometricTokenHash,
} from "../integrations/fayda.adapter";
import { amlAdapter } from "../integrations/aml.adapter";
import { RequestContext } from "../utils/requestContext";

const MINIMUM_AGE_YEARS = 0;

/** Whole years elapsed, accounting for whether this year's birthday has passed. */
export function calculateAge(dateOfBirth: string, now = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

export interface KycResult {
  user: UserProfileResponse;
  /** Reissued because the embedded account_status changes on success. */
  token: string;
  verification: {
    confidence: number;
    transactionId: string;
    riskScore: number;
  };
}

export class KycService {
  /**
   * Onboarding Step 2.
   *
   * Runs biometric verification, the 18+ assertion and AML screening before
   * anything is written, so a rejected applicant never has their account
   * partially mutated.
   */
  async verifyFayda(
    userId: string,
    payload: FaydaKYCRequest,
    context: Partial<RequestContext> = {},
  ): Promise<KycResult> {
    const users = new UserRepository(pool);
    const existing = await users.findById(userId);

    if (!existing.success || !existing.data) {
      throw ApiError.notFound(
        "USER_NOT_FOUND",
        "This account no longer exists.",
      );
    }

    if (existing.data.account_status === "ACTIVE_VERIFIED") {
      throw ApiError.conflict(
        "ALREADY_VERIFIED",
        "This account has already completed identity verification.",
      );
    }

    if (
      existing.data.account_status === "SUSPENDED_FRAUD" ||
      existing.data.account_status === "FLAGGED_AML"
    ) {
      throw ApiError.forbidden(
        "ACCOUNT_RESTRICTED",
        "This account is restricted and cannot be verified. Contact support.",
      );
    }

    const maskedId = maskFaydaId(payload.fayda_id_number);
    const idHash = faydaIdHash(payload.fayda_id_number);

    // One national ID may back only one account.
    if (await users.faydaIdExists(idHash)) {
      throw ApiError.conflict(
        "FAYDA_ID_ALREADY_LINKED",
        "This Fayda National ID is already linked to another account.",
      );
    }

    const outcome = await faydaAdapter.verify(
      payload.fayda_id_number,
      payload.live_selfie_base64,
    );

    if (!outcome.success || !outcome.data) {
      await recordAuditDetached({
        userId,
        category: "KYC",
        eventType: "FAYDA_VERIFICATION_FAILED",
        severity: "WARNING",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: { code: outcome.error?.code },
      });

      throw ApiError.unprocessable(
        outcome.error?.code ?? "FAYDA_VERIFICATION_FAILED",
        outcome.error?.message ?? "Identity verification failed.",
      );
    }

    const profile = outcome.data.demographic_profile;
    const age = calculateAge(profile.date_of_birth);

    if (age <= MINIMUM_AGE_YEARS) {
      await recordAuditDetached({
        userId,
        category: "KYC",
        eventType: "KYC_REJECTED_UNDERAGE",
        severity: "WARNING",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      throw ApiError.unprocessable(
        "UNDERAGE_APPLICANT",
        `Investors must be at least ${MINIMUM_AGE_YEARS} years old to open an account.`,
      );
    }

    const screening = await amlAdapter.screen({
      faydaIdNumber: payload.fayda_id_number,
      fullName: existing.data.full_name_raw,
    });

    const accountStatus: AccountStatus = screening.cleared
      ? "ACTIVE_VERIFIED"
      : "FLAGGED_AML";

    const tokenHash = biometricTokenHash(
      payload.fayda_id_number,
      outcome.data.verification_metadata.fayda_transaction_id,
    );

    await withTransaction(async (connection) => {
      const transactionalUsers = new UserRepository(connection);

      const update = await transactionalUsers.updateData({
        userId,
        fayda_id_number_masked: maskedId,
        fayda_id_hash: idHash,
        fayda_biometric_token_hash: tokenHash,
        date_of_birth: profile.date_of_birth,
        account_status: accountStatus,
        risk_score_matrix: screening.riskScore,
      });

      if (!update.success) {
        throw ApiError.internal(
          "KYC_PERSIST_FAILED",
          "Could not save your verification result.",
          update.error,
        );
      }

      await recordAudit(connection, {
        userId,
        category: "KYC",
        eventType: screening.cleared ? "KYC_VERIFIED" : "KYC_FLAGGED_AML",
        severity: screening.cleared ? "INFO" : "CRITICAL",
        referenceId: outcome.data!.verification_metadata.fayda_transaction_id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          confidence:
            outcome.data!.biometric_assessment.confidence_score_percentage,
          risk_score: screening.riskScore,
          matched_list: screening.matchedList ?? null,
          verification_mode: faydaAdapter.mode,
        },
      });
    });

    if (!screening.cleared) {
      throw ApiError.forbidden(
        "AML_SCREENING_FAILED",
        screening.reason ??
          "Your identity matched a financial watchlist. Our compliance team will contact you.",
      );
    }

    const updated = await users.findById(userId);
    if (!updated.success || !updated.data) {
      throw ApiError.internal(
        "USER_RELOAD_FAILED",
        "Could not reload your profile.",
      );
    }

    const user: UserProfileResponse = {
      ...updated.data,
      is_diaspora_account: Boolean(updated.data.is_diaspora_account),
    };

    return {
      user,
      token: signToken({
        userId,
        email: user.email_address,
        accountStatus: user.account_status as AccountStatus,
        role: "INVESTOR",
      }),
      verification: {
        confidence:
          outcome.data.biometric_assessment.confidence_score_percentage,
        transactionId: outcome.data.verification_metadata.fayda_transaction_id,
        riskScore: screening.riskScore,
      },
    };
  }

  async getStatus(userId: string) {
    const users = new UserRepository(pool);
    const result = await users.findById(userId);

    if (!result.success || !result.data) {
      throw ApiError.notFound(
        "USER_NOT_FOUND",
        "This account no longer exists.",
      );
    }

    return {
      account_status: result.data.account_status,
      fayda_id_number_masked: result.data.fayda_id_number_masked,
      verified: result.data.account_status === "ACTIVE_VERIFIED",
      risk_score_matrix: result.data.risk_score_matrix,
    };
  }
}

export const kycService = new KycService();
