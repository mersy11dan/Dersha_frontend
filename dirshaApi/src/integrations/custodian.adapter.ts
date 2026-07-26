import { createHash } from "node:crypto";
import { isMockMode, env } from "../config/env";

export interface CustodyVerification {
  confirmed: boolean;
  verificationToken: string;
  custodianReference: string;
  reason?: string;
}

export interface CustodianAdapter {
  readonly mode: "MOCK" | "LIVE";
  confirmCustody(input: {
    assetId: string;
    custodianBankName: string;
    trustDeedReference: string;
    vaultReceiptReference: string;
  }): Promise<CustodyVerification>;
}

/**
 * Stand-in for the custodian bank's deed-registry API.
 *
 * Trust deed references beginning with "TD-INVALID" simulate a rejection so the
 * failure path can be exercised without a live custodian.
 */
class MockCustodianAdapter implements CustodianAdapter {
  readonly mode = "MOCK" as const;

  async confirmCustody(input: {
    assetId: string;
    custodianBankName: string;
    trustDeedReference: string;
    vaultReceiptReference: string;
  }): Promise<CustodyVerification> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (input.trustDeedReference.toUpperCase().startsWith("TD-INVALID")) {
      return {
        confirmed: false,
        verificationToken: "",
        custodianReference: "",
        reason:
          "The custodian could not locate a sealed trust deed with that reference.",
      };
    }

    const verificationToken = createHash("sha256")
      .update(
        `${input.assetId}:${input.trustDeedReference}:${input.vaultReceiptReference}`,
      )
      .digest("hex");

    return {
      confirmed: true,
      verificationToken,
      custodianReference: `CUST-${input.trustDeedReference.toUpperCase()}`,
    };
  }
}

class LiveCustodianAdapter implements CustodianAdapter {
  readonly mode = "LIVE" as const;

  async confirmCustody(): Promise<CustodyVerification> {
    if (!env.custodian.sftpHost) {
      throw new Error(
        "Live custodian integration is not configured. Set CUSTODIAN_SFTP_HOST or use PARTNER_MODE=MOCK.",
      );
    }
    throw new Error("LiveCustodianAdapter is not implemented yet.");
  }
}

export const custodianAdapter: CustodianAdapter = isMockMode
  ? new MockCustodianAdapter()
  : new LiveCustodianAdapter();
