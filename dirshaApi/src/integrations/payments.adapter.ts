import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env, isMockMode } from "../config/env";

export type PaymentChannel =
  | "TELEBIRR"
  | "CBE_BIRR"
  | "AWASH_DIRECT"
  | "CBE_DIRECT";

export interface PaymentIntent {
  /** Token the client hands to the mobile-money or banking app. */
  merchantPaymentToken: string;
  /** Reference the switch echoes back on the settlement webhook. */
  externalReference: string;
  checkoutUrl?: string;
  network: string;
}

export interface PayoutInstruction {
  externalReference: string;
  network: string;
  estimatedSettlementSeconds: number;
}

export interface PaymentsAdapter {
  readonly mode: "MOCK" | "LIVE";
  createDepositIntent(input: {
    userId: string;
    amountEtb: number;
    channel: PaymentChannel;
    idempotencyKey: string;
  }): Promise<PaymentIntent>;
  requestPayout(input: {
    userId: string;
    amountEtb: number;
    bankCode: string;
    accountNumber: string;
    idempotencyKey: string;
  }): Promise<PayoutInstruction>;
  /**
   * Called once the deposit is committed to the ledger. Only the mock uses it,
   * to start its simulated settlement clock; a real switch is driven by the
   * customer authorising the payment.
   */
  onDepositRecorded?(externalReference: string): void;
}

/** Signs webhook payloads exactly as the gateway would, so both modes verify identically. */
export function signWebhookPayload(rawBody: string): string {
  return createHmac("sha256", env.payments.webhookSecret)
    .update(rawBody)
    .digest("hex");
}

export function verifyWebhookSignature(
  rawBody: string,
  providedSignature: string | undefined,
): boolean {
  if (!providedSignature) return false;

  const expected = Buffer.from(signWebhookPayload(rawBody), "utf8");
  const actual = Buffer.from(providedSignature, "utf8");

  // Length must match before timingSafeEqual, which throws on mismatched sizes.
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

const NETWORK_BY_CHANNEL: Record<PaymentChannel, string> = {
  TELEBIRR: "TELEBIRR",
  CBE_BIRR: "CBE_BIRR",
  AWASH_DIRECT: "ETHSWITCH",
  CBE_DIRECT: "ETHSWITCH",
};

/**
 * Simulates EthSwitch / Telebirr.
 *
 * Deposits are settled by a deferred callback rather than inline, so the real
 * asynchronous webhook path is the one under test in development too.
 */
class MockPaymentsAdapter implements PaymentsAdapter {
  readonly mode = "MOCK" as const;

  /** Registered by the wallet service to avoid a circular import. */
  static onSettlement:
    | ((externalReference: string) => Promise<void>)
    | null = null;

  async createDepositIntent(input: {
    userId: string;
    amountEtb: number;
    channel: PaymentChannel;
    idempotencyKey: string;
  }): Promise<PaymentIntent> {
    return {
      merchantPaymentToken: `MPT-${randomUUID()}`,
      externalReference: `SIM-${input.channel}-${randomUUID()}`,
      network: NETWORK_BY_CHANNEL[input.channel],
    };
  }

  /**
   * Waits for the ledger row before firing, otherwise the callback can arrive
   * before the deposit it settles and find nothing to update.
   */
  onDepositRecorded(externalReference: string): void {
    // Mimics the delay between a user authorising in their wallet app and the
    // switch posting the settlement callback.
    setTimeout(() => {
      void MockPaymentsAdapter.onSettlement?.(externalReference).catch((error) =>
        console.error("[payments:mock] settlement callback failed", error),
      );
    }, 1500);
  }

  async requestPayout(input: {
    userId: string;
    amountEtb: number;
    bankCode: string;
    accountNumber: string;
    idempotencyKey: string;
  }): Promise<PayoutInstruction> {
    return {
      externalReference: `SIM-PAYOUT-${input.bankCode}-${randomUUID()}`,
      network: "ETHSWITCH",
      estimatedSettlementSeconds: 90,
    };
  }
}

class LivePaymentsAdapter implements PaymentsAdapter {
  readonly mode = "LIVE" as const;

  private assertConfigured() {
    if (!env.payments.baseUrl || !env.payments.apiKey) {
      throw new Error(
        "Live payment gateway is not configured. Set PAYMENT_GATEWAY_BASE_URL and PAYMENT_GATEWAY_API_KEY.",
      );
    }
  }

  async createDepositIntent(input: {
    userId: string;
    amountEtb: number;
    channel: PaymentChannel;
    idempotencyKey: string;
  }): Promise<PaymentIntent> {
    this.assertConfigured();

    const response = await fetch(`${env.payments.baseUrl}/v1/payments/intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.payments.apiKey}`,
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        amount: input.amountEtb,
        currency: "ETB",
        channel: input.channel,
        customer_reference: input.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Payment gateway rejected the deposit intent (HTTP ${response.status}).`,
      );
    }

    const body: any = await response.json();
    return {
      merchantPaymentToken: body.payment_token,
      externalReference: body.reference,
      checkoutUrl: body.checkout_url,
      network: NETWORK_BY_CHANNEL[input.channel],
    };
  }

  async requestPayout(input: {
    userId: string;
    amountEtb: number;
    bankCode: string;
    accountNumber: string;
    idempotencyKey: string;
  }): Promise<PayoutInstruction> {
    this.assertConfigured();

    const response = await fetch(`${env.payments.baseUrl}/v1/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.payments.apiKey}`,
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        amount: input.amountEtb,
        currency: "ETB",
        bank_code: input.bankCode,
        account_number: input.accountNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Payment gateway rejected the payout (HTTP ${response.status}).`,
      );
    }

    const body: any = await response.json();
    return {
      externalReference: body.reference,
      network: "ETHSWITCH",
      estimatedSettlementSeconds: body.eta_seconds ?? 120,
    };
  }
}

export const paymentsAdapter: PaymentsAdapter = isMockMode
  ? new MockPaymentsAdapter()
  : new LivePaymentsAdapter();

export { MockPaymentsAdapter };
