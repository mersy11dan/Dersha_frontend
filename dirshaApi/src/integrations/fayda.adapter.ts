import { createHash } from "node:crypto";
import { FaydaVerificationResponse } from "../types/auth/fayda.types";
import { env, isMockMode } from "../config/env";
import { faydaVerification } from "../utils/faydaVerifier";

export interface FaydaVerificationOutcome {
  success: boolean;
  data?: FaydaVerificationResponse;
  error?: { code: string; message: string; [key: string]: unknown };
}

export interface FaydaAdapter {
  readonly mode: "MOCK" | "LIVE";
  verify(
    faydaIdNumber: string,
    liveSelfieBase64: string,
  ): Promise<FaydaVerificationOutcome>;
}

/** Normalises 1234-5678-9012 and 123456789012 to the same canonical digits. */
export function normaliseFaydaId(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Only the final four digits are ever persisted or displayed. */
export function maskFaydaId(raw: string): string {
  const digits = normaliseFaydaId(raw);
  return `FYD-****-${digits.slice(-4)}`;
}

/**
 * Lookup key for "one national ID, one account". The masked form keeps only
 * four digits, so two unrelated citizens would collide on it; this hash
 * distinguishes them without the number ever being stored.
 */
export function faydaIdHash(raw: string): string {
  return createHash("sha256")
    .update(`fayda:${normaliseFaydaId(raw)}`)
    .digest("hex");
}

/** Derives the SHA-256 biometric token stored against the account. */
export function biometricTokenHash(
  faydaIdNumber: string,
  transactionId: string,
): string {
  return createHash("sha256")
    .update(`${normaliseFaydaId(faydaIdNumber)}:${transactionId}`)
    .digest("hex");
}

/**
 * Deterministic stand-in for the National ID Program API.
 *
 * The last digit of the national ID selects the scenario, which makes every
 * branch of the onboarding flow reproducible without partner credentials:
 *   - ends in 0 : biometric mismatch (low confidence)
 *   - ends in 1 : holder is under 18
 *   - otherwise : verified adult
 */
class MockFaydaAdapter implements FaydaAdapter {
  readonly mode = "MOCK" as const;

  async verify(
    faydaIdNumber: string,
    liveSelfieBase64: string,
  ): Promise<FaydaVerificationOutcome> {
    const digits = normaliseFaydaId(faydaIdNumber);

    // Simulate realistic network latency so client loading states are exercised.
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!liveSelfieBase64 || liveSelfieBase64.length < 32) {
      return {
        success: false,
        error: {
          code: "BIOMETRIC_CAPTURE_INVALID",
          message: "The biometric capture was empty or corrupted.",
        },
      };
    }

    const lastDigit = Number(digits.slice(-1));
    const confidence = lastDigit === 0 ? 61.4 : 98.2;

    if (confidence < env.fayda.minConfidence) {
      return {
        success: false,
        error: {
          code: "BIOMETRIC_MATCH_FAILED",
          message:
            "Identity verification failed. The photo does not match the national registry profile.",
          confidence,
        },
      };
    }

    const dateOfBirth =
      lastDigit === 1
        ? new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000)
            .toISOString()
            .slice(0, 10)
        : "1994-06-15";

    return {
      success: true,
      data: {
        verification_metadata: {
          fayda_transaction_id: `MOCK-FYD-${digits.slice(-6)}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          issuing_authority: "National ID Program (SIMULATED)",
          digital_signature_rsa: createHash("sha256")
            .update(`mock-signature:${digits}`)
            .digest("hex"),
        },
        biometric_assessment: {
          face_match_passed: true,
          confidence_score_percentage: confidence,
          liveness_verified_by_partner: true,
        },
        demographic_profile: {
          fayda_number_masked: maskFaydaId(faydaIdNumber),
          names: { english: "Simulated Holder", amharic: "ተመሳሳይ ባለቤት" },
          date_of_birth: dateOfBirth,
          gender: Number(digits.slice(-2, -1)) % 2 === 0 ? "FEMALE" : "MALE",
          phone_number_registered: `+2519${digits.slice(0, 8)}`,
        },
        registered_address: {
          region: "Addis Ababa",
          sub_city_zone: "Bole",
          woreda: "03",
          house_number: digits.slice(-3),
        },
        photo_identity: { mime_type: "image/jpeg", base64_image_string: "" },
      },
    };
  }
}

/** Calls the real NIDP endpoint through the existing verifier utility. */
class LiveFaydaAdapter implements FaydaAdapter {
  readonly mode = "LIVE" as const;

  async verify(
    faydaIdNumber: string,
    liveSelfieBase64: string,
  ): Promise<FaydaVerificationOutcome> {
    const result = await faydaVerification(
      normaliseFaydaId(faydaIdNumber),
      liveSelfieBase64,
    );

    if (!result.success) {
      const error = (result as { error: any }).error;
      return {
        success: false,
        error: {
          code: error?.code ?? "FAYDA_GATEWAY_ERROR",
          message:
            error?.message ??
            "Could not reach the National ID Program. Please try again.",
          ...error,
        },
      };
    }

    return { success: true, data: result.data };
  }
}

export const faydaAdapter: FaydaAdapter = isMockMode
  ? new MockFaydaAdapter()
  : new LiveFaydaAdapter();
