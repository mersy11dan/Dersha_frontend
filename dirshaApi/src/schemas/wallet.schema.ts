import { z } from "zod";

// Idempotency keys are minted by the client so a retried submission cannot
// double-fund an account: IDEM-DEPOSIT-<uuid> or IDEM-WITHDRAW-<uuid>.
const idempotencyKeyRegex =
  /^IDEM-(DEPOSIT|WITHDRAW)-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

// =====================================================================================
// 1. INPUT REQUEST SCHEMAS (Inbound Transaction Gateway Controls)
// =====================================================================================

export const WalletDepositRequestSchema = z.object({
  amount_etb: z
    .number({ error: "Deposit amount is required" })
    .positive("Deposit amount must be greater than zero")
    .min(10, "Minimum allowed deposit is 10 ETB")
    .max(1000000, "Maximum deposit per single transaction is 1,000,000 ETB")
    .multipleOf(0.0001, "Amount precision cannot exceed 4 decimal places"),
  payment_channel: z.enum(
    ["TELEBIRR", "CBE_BIRR", "AWASH_DIRECT", "CBE_DIRECT"],
    { error: "Please select a valid payment channel gateway" },
  ),
  idempotency_key: z
    .string({ error: "System idempotency key is required" })
    .regex(
      idempotencyKeyRegex,
      "Malformed state machine idempotency signature key",
    ),
});

export const WalletWithdrawalRequestSchema = z.object({
  amount_etb: z
    .number({ error: "Withdrawal amount is required" })
    .positive("Withdrawal amount must be greater than zero")
    .min(100, "Minimum allowed withdrawal amount is 100 ETB")
    .max(500000, "Maximum withdrawal transaction limit is 500,000 ETB")
    .multipleOf(0.0001, "Amount precision cannot exceed 4 decimal places"),
  destination_bank_code: z.enum(
    ["CBEETET", "AWABETET", "DASBETET", "WGBETET", "BOAETET"],
    { error: "Please select a supported partner commercial bank" },
  ),
  destination_account_number: z
    .string({ error: "Target bank account number is required" })
    .trim()
    .min(10, "Bank account number must be at least 10 characters long")
    .max(25, "Bank account number cannot exceed 25 characters"),
  idempotency_key: z
    .string({ error: "System idempotency key is required" })
    .regex(
      idempotencyKeyRegex,
      "Malformed state machine idempotency signature key",
    ),
});

/** Settlement callback posted by the payment switch. */
export const PaymentWebhookSchema = z.object({
  external_reference: z.string().min(4),
  status: z.enum(["SETTLED", "FAILED"]),
  amount_etb: z.number().positive().optional(),
  failure_reason: z.string().optional(),
});

// =====================================================================================
// 2. OUTPUT RESPONSE SCHEMAS (Financial Profile Sanitization Layer)
// =====================================================================================

export const WalletBalanceResponseSchema = z.object({
  wallet_id: z.string().uuid(),
  user_id: z.string().uuid(),
  available_balance_etb: z.number(),
  escrowed_balance_etb: z.number(),
  currency_code: z.string().length(3),
  updated_at: z.date(),
});

export const TransactionRecordResponseSchema = z.object({
  transaction_id: z.string().uuid(),
  type: z.enum([
    "DEPOSIT",
    "WITHDRAWAL",
    "DIVIDEND_PAYOUT",
    "P2P_TRADE_SETTLEMENT",
    "AMM_BUYBACK_PAYOUT",
    "BASKET_ROYALTY",
    "PRIMARY_SUBSCRIPTION",
  ]),
  gross_amount_etb: z.number(),
  fee_deducted_etb: z.number(),
  net_amount_etb: z.number(),
  payment_network: z.string(),
  status: z.enum([
    "SETTLED",
    "PROCESSING",
    "ESCROWED",
    "FAILED",
    "PENDING_BANK_VERIFICATION",
  ]),
  recorded_at: z.date(),
});

/**
 * INTERNAL SYSTEM SCHEMA - NOT EXPOSED TO PUBLIC ROUTERS
 * Validates the payload used to provision a new ledger account.
 */
export const InternalWalletCreationSchema = z.object({
  user_id: z
    .string({ error: "System User UUID is required to provision a wallet" })
    .uuid("Invalid User UUID structure alignment"),
  currency_code: z
    .string()
    .length(3, "Currency code must follow ISO 4217 standard (3 characters)")
    .default("ETB"),
  initial_balance: z
    .number()
    .refine((val) => val === 0, {
      message:
        "Security Protocol Violation: New wallets must be initialized with an absolute zero balance",
    })
    .default(0),
});

// =====================================================================================
// 3. TYPES INFERENCE (Compile-Time TypeScript Verification)
// =====================================================================================
export type WalletDepositRequest = z.infer<typeof WalletDepositRequestSchema>;
export type WalletWithdrawalRequest = z.infer<
  typeof WalletWithdrawalRequestSchema
>;
export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookSchema>;
export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;
export type TransactionRecordResponse = z.infer<
  typeof TransactionRecordResponseSchema
>;
export type InternalWalletCreation = z.infer<
  typeof InternalWalletCreationSchema
>;
