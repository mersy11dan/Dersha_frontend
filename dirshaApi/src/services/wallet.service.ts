import { randomUUID } from "node:crypto";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit, recordAuditDetached } from "../repository/AuditRepository";
import {
  WalletDepositRequest,
  WalletWithdrawalRequest,
  WalletBalanceResponse,
  TransactionRecordResponse,
} from "../schemas/wallet.schema";
import {
  paymentsAdapter,
  MockPaymentsAdapter,
  PaymentChannel,
} from "../integrations/payments.adapter";
import { ApiError } from "../utils/ApiError";
import { toCash } from "../utils/money";
import { RequestContext } from "../utils/requestContext";

export interface DepositInitiation {
  transaction_id: string;
  status: string;
  amount_etb: number;
  merchant_payment_token: string;
  external_reference: string;
  checkout_url?: string;
  payment_network: string;
}

export class WalletService {
  private readonly wallets = new WalletRepository(pool);

  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    const balance = await this.wallets.findBalanceByUserId(userId);

    if (!balance) {
      throw ApiError.notFound(
        "WALLET_NOT_FOUND",
        "No wallet exists for this account.",
      );
    }

    return balance;
  }

  async getTransactions(
    userId: string,
    limit = 50,
  ): Promise<TransactionRecordResponse[]> {
    return this.wallets.findTransactionsByUserId(userId, limit);
  }

  async getTransaction(userId: string, transactionId: string) {
    const row = await this.wallets.findTransactionById(transactionId, userId);

    if (!row) {
      throw ApiError.notFound(
        "TRANSACTION_NOT_FOUND",
        "No such transaction on this account.",
      );
    }

    return {
      transaction_id: row.transaction_id,
      type: row.type,
      status: row.status,
      gross_amount_etb: toCash(row.gross_amount_etb),
      net_amount_etb: toCash(row.net_amount_etb),
      payment_network: row.payment_network,
      external_reference: row.external_reference,
      failure_reason: row.failure_reason,
      recorded_at: row.recorded_at,
      settled_at: row.settled_at,
    };
  }

  /**
   * Flow 1 Step 3. Registers a PROCESSING ledger row and asks the switch for a
   * payment token.
   *
   * No money is credited here. Cash only lands in the wallet when the switch
   * confirms settlement over the webhook, which is what keeps the platform
   * ledger in step with the custodian escrow account.
   */
  async initiateDeposit(
    userId: string,
    request: WalletDepositRequest,
    context: Partial<RequestContext> = {},
  ): Promise<DepositInitiation> {
    const existing = await this.wallets.findTransactionByIdempotencyKey(
      request.idempotency_key,
    );

    // A retried submission returns the original transaction rather than
    // creating a second funding hook.
    if (existing) {
      return {
        transaction_id: existing.transaction_id,
        status: existing.status,
        amount_etb: toCash(existing.gross_amount_etb),
        merchant_payment_token: "",
        external_reference: existing.external_reference ?? "",
        payment_network: existing.payment_network,
      };
    }

    const intent = await paymentsAdapter.createDepositIntent({
      userId,
      amountEtb: request.amount_etb,
      channel: request.payment_channel as PaymentChannel,
      idempotencyKey: request.idempotency_key,
    });

    const transactionId = randomUUID();

    await withTransaction(async (connection) => {
      const wallets = new WalletRepository(connection);
      const wallet = await wallets.lockWallet(connection, userId);

      await wallets.recordTransaction(connection, {
        transactionId,
        userId,
        walletId: wallet.wallet_id,
        type: "DEPOSIT",
        grossAmountEtb: request.amount_etb,
        netAmountEtb: request.amount_etb,
        paymentNetwork: intent.network,
        status: "PROCESSING",
        idempotencyKey: request.idempotency_key,
        externalReference: intent.externalReference,
      });

      await recordAudit(connection, {
        userId,
        category: "WALLET",
        eventType: "DEPOSIT_INITIATED",
        referenceId: transactionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          amount_etb: request.amount_etb,
          channel: request.payment_channel,
          external_reference: intent.externalReference,
        },
      });
    });

    // Only now can a settlement callback find the row it is meant to settle.
    paymentsAdapter.onDepositRecorded?.(intent.externalReference);

    return {
      transaction_id: transactionId,
      status: "PROCESSING",
      amount_etb: request.amount_etb,
      merchant_payment_token: intent.merchantPaymentToken,
      external_reference: intent.externalReference,
      checkout_url: intent.checkoutUrl,
      payment_network: intent.network,
    };
  }

  /**
   * Applies a settlement callback from the payment switch.
   *
   * Idempotent by design: the switch may deliver the same callback more than
   * once, and a second delivery must not credit the wallet twice.
   */
  async settleDeposit(
    externalReference: string,
    outcome: { status: "SETTLED" | "FAILED"; failureReason?: string },
  ): Promise<void> {
    await withTransaction(async (connection) => {
      const wallets = new WalletRepository(connection);

      // Lock the ledger row so two concurrent callbacks cannot both settle it.
      const [rows]: any = await connection.execute(
        `SELECT * FROM financial_transactions_ledger
         WHERE external_reference = ? FOR UPDATE`,
        [externalReference],
      );
      const transaction = rows[0];

      if (!transaction) {
        console.warn(
          `[wallet] settlement callback for unknown reference ${externalReference}`,
        );
        return;
      }

      if (transaction.status === "SETTLED" || transaction.status === "FAILED") {
        return; // Already terminal; replayed callback.
      }

      if (outcome.status === "FAILED") {
        await wallets.updateTransactionStatus(
          connection,
          transaction.transaction_id,
          "FAILED",
          { failureReason: outcome.failureReason ?? "Gateway reported failure" },
        );

        await recordAudit(connection, {
          userId: transaction.user_id,
          category: "WALLET",
          eventType: "DEPOSIT_FAILED",
          severity: "WARNING",
          referenceId: transaction.transaction_id,
          payload: { reason: outcome.failureReason ?? null },
        });
        return;
      }

      const amount = toCash(transaction.net_amount_etb);

      await wallets.lockWallet(connection, transaction.user_id);
      await wallets.creditAvailable(connection, transaction.user_id, amount);
      await wallets.updateTransactionStatus(
        connection,
        transaction.transaction_id,
        "SETTLED",
        { settledAt: new Date() },
      );

      await recordAudit(connection, {
        userId: transaction.user_id,
        category: "WALLET",
        eventType: "DEPOSIT_SETTLED",
        referenceId: transaction.transaction_id,
        payload: {
          amount_etb: amount,
          external_reference: externalReference,
        },
      });
    });
  }

  /**
   * Flow 1 outbound. Moves cash to escrow immediately so it cannot be spent
   * elsewhere while the payout is in flight, then instructs the switch.
   */
  async requestWithdrawal(
    userId: string,
    request: WalletWithdrawalRequest,
    context: Partial<RequestContext> = {},
  ) {
    const existing = await this.wallets.findTransactionByIdempotencyKey(
      request.idempotency_key,
    );

    if (existing) {
      return {
        transaction_id: existing.transaction_id,
        status: existing.status,
        amount_etb: toCash(existing.gross_amount_etb),
      };
    }

    const transactionId = randomUUID();

    await withTransaction(async (connection) => {
      const wallets = new WalletRepository(connection);
      const wallet = await wallets.lockWallet(connection, userId);

      await wallets.moveToEscrow(
        connection,
        userId,
        request.amount_etb,
        "PENDING_BANK_WITHDRAWAL",
        transactionId,
      );

      await wallets.recordTransaction(connection, {
        transactionId,
        userId,
        walletId: wallet.wallet_id,
        type: "WITHDRAWAL",
        grossAmountEtb: request.amount_etb,
        netAmountEtb: request.amount_etb,
        paymentNetwork: "ETHSWITCH",
        status: "ESCROWED",
        idempotencyKey: request.idempotency_key,
      });

      await recordAudit(connection, {
        userId,
        category: "WALLET",
        eventType: "WITHDRAWAL_REQUESTED",
        referenceId: transactionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          amount_etb: request.amount_etb,
          bank_code: request.destination_bank_code,
          // Only the tail of the account number is retained in the audit trail.
          account_tail: request.destination_account_number.slice(-4),
        },
      });
    });

    let payout;
    try {
      payout = await paymentsAdapter.requestPayout({
        userId,
        amountEtb: request.amount_etb,
        bankCode: request.destination_bank_code,
        accountNumber: request.destination_account_number,
        idempotencyKey: request.idempotency_key,
      });
    } catch (error) {
      // The gateway refused the instruction, so give the money back rather than
      // stranding it in escrow.
      await withTransaction(async (connection) => {
        const wallets = new WalletRepository(connection);
        await wallets.releaseEscrow(
          connection,
          userId,
          request.amount_etb,
          transactionId,
        );
        await wallets.updateTransactionStatus(
          connection,
          transactionId,
          "FAILED",
          { failureReason: "Payment gateway rejected the payout instruction" },
        );
      });

      throw ApiError.serviceUnavailable(
        "PAYOUT_GATEWAY_UNAVAILABLE",
        "The payment network could not accept this withdrawal. Your funds have been returned to your available balance.",
      );
    }

    await withTransaction(async (connection) => {
      await connection.execute(
        `UPDATE financial_transactions_ledger
         SET external_reference = ?, status = 'PENDING_BANK_VERIFICATION'
         WHERE transaction_id = ?`,
        [payout.externalReference, transactionId],
      );
    });

    return {
      transaction_id: transactionId,
      status: "PENDING_BANK_VERIFICATION",
      amount_etb: request.amount_etb,
      external_reference: payout.externalReference,
      estimated_settlement_seconds: payout.estimatedSettlementSeconds,
    };
  }

  /** Completes a payout once the bank confirms the debit cleared. */
  async settleWithdrawal(
    transactionId: string,
    outcome: { status: "SETTLED" | "FAILED"; failureReason?: string },
  ): Promise<void> {
    await withTransaction(async (connection) => {
      const wallets = new WalletRepository(connection);

      const [rows]: any = await connection.execute(
        `SELECT * FROM financial_transactions_ledger
         WHERE transaction_id = ? FOR UPDATE`,
        [transactionId],
      );
      const transaction = rows[0];

      if (!transaction || transaction.status === "SETTLED" || transaction.status === "FAILED") {
        return;
      }

      const amount = toCash(transaction.gross_amount_etb);

      if (outcome.status === "SETTLED") {
        await wallets.spendEscrow(
          connection,
          transaction.user_id,
          amount,
          transactionId,
        );
        await wallets.updateTransactionStatus(
          connection,
          transactionId,
          "SETTLED",
          { settledAt: new Date() },
        );
      } else {
        await wallets.releaseEscrow(
          connection,
          transaction.user_id,
          amount,
          transactionId,
        );
        await wallets.updateTransactionStatus(
          connection,
          transactionId,
          "FAILED",
          { failureReason: outcome.failureReason ?? "Bank rejected the payout" },
        );
      }

      await recordAudit(connection, {
        userId: transaction.user_id,
        category: "WALLET",
        eventType:
          outcome.status === "SETTLED" ? "WITHDRAWAL_SETTLED" : "WITHDRAWAL_FAILED",
        severity: outcome.status === "SETTLED" ? "INFO" : "WARNING",
        referenceId: transactionId,
        payload: { amount_etb: amount },
      });
    });
  }
}

export const walletService = new WalletService();

// In MOCK mode the simulated switch drives settlement through exactly the same
// entry point the real webhook uses. Wired here rather than inside the adapter
// to keep the adapter free of a dependency on the service.
MockPaymentsAdapter.onSettlement = async (externalReference: string) => {
  await walletService.settleDeposit(externalReference, { status: "SETTLED" });
  await recordAuditDetached({
    category: "WALLET",
    eventType: "MOCK_GATEWAY_SETTLEMENT",
    referenceId: externalReference,
  });
};
