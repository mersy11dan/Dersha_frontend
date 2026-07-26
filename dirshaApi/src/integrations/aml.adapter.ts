import { isMockMode } from "../config/env";
import { normaliseFaydaId } from "./fayda.adapter";

export interface AmlScreeningResult {
  cleared: boolean;
  /** 0 (clean) to 100 (confirmed match), persisted as users.risk_score_matrix. */
  riskScore: number;
  matchedList?: string;
  reason?: string;
}

export interface AmlAdapter {
  screen(input: {
    faydaIdNumber: string;
    fullName: string;
  }): Promise<AmlScreeningResult>;
}

/**
 * Stand-in for the Financial Intelligence Service blacklist.
 *
 * IDs ending in 99 simulate a confirmed sanctions hit so the FLAGGED_AML branch
 * can be exercised; everything else clears with a low risk score.
 */
class MockAmlAdapter implements AmlAdapter {
  async screen(input: {
    faydaIdNumber: string;
    fullName: string;
  }): Promise<AmlScreeningResult> {
    const digits = normaliseFaydaId(input.faydaIdNumber);
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (digits.endsWith("99")) {
      return {
        cleared: false,
        riskScore: 95,
        matchedList: "FIS_NATIONAL_SANCTIONS (SIMULATED)",
        reason: "Identity matched an entry on the AML watchlist.",
      };
    }

    return { cleared: true, riskScore: digits.endsWith("9") ? 35 : 5 };
  }
}

/**
 * Placeholder for the real FIS integration. Screening cannot be silently
 * skipped in LIVE mode, so this fails closed until the integration is built.
 */
class LiveAmlAdapter implements AmlAdapter {
  async screen(): Promise<AmlScreeningResult> {
    throw new Error(
      "Live FIS AML screening is not configured. Set PARTNER_MODE=MOCK or implement LiveAmlAdapter.",
    );
  }
}

export const amlAdapter: AmlAdapter = isMockMode
  ? new MockAmlAdapter()
  : new LiveAmlAdapter();
