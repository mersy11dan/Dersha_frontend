import { PoolConnection } from "mysql2/promise";
import { ParentRepository, SqlExecutor } from "./ParentRepository";
import {
  InternalWalletCreation,
  WalletWithdrawalRequest,
  WalletBalanceResponse,
  TransactionRecordResponse,
} from "../schemas/wallet.schema";
import { ChangeResponseType } from "../types/return.types";
import { toCash, cashLiteral, cashGte } from "../utils/money";
import { ApiError } from "../utils/ApiError";

export type EscrowReason =
  | "OPEN_BUY_LIMIT_ORDER"
  | "PENDING_BANK_WITHDRAWAL"
  | "CROWDFUNDING_POOL_LOCK"
  | "PENDING_DEPOSIT_SETTLEMENT"
  | "BASKET_FRACTION_PURCHASE"
  | "AMM_SETTLEMENT";

export type LedgerTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "DIVIDEND_PAYOUT"
  | "P2P_TRADE_SETTLEMENT"
  | "AMM_BUYBACK_PAYOUT"
  | "BASKET_ROYALTY"
  | "PRIMARY_SUBSCRIPTION";

export type LedgerStatus =
  | "SETTLED"
  | "PROCESSING"
  | "ESCROWED"
  | "FAILED"
  | "PENDING_BANK_VERIFICATION";

/**
 * Owns every balance mutation.
 *
 * Any method that changes a balance requires a transaction-scoped connection
 * and takes a row lock first, so concurrent requests for the same wallet
 * serialise instead of racing.
 */
export class WalletRepository extends ParentRepository<
  InternalWalletCreation,
  WalletWithdrawalRequest,
  TransactionRecordResponse[]
> {
  constructor(connection: SqlExecutor) {
    super(connection);
  }

  async saveData(data: InternalWalletCreation): Promise<ChangeResponseType> {
    try {
      await this.connection.execute(
        `INSERT INTO wallets (user_id, available_balance_etb, escrowed_balance_etb, currency_code)
         VALUES (?, 0.0000, 0.0000, ?)`,
        [data.user_id, data.currency_code],
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async updateData(): Promise<ChangeResponseType> {
    // Balance changes go through the explicit credit/debit/escrow helpers below,
    // which all require a locked row. A generic update would bypass that.
    throw new Error(
      "WalletRepository.updateData is not supported; use the explicit balance methods.",
    );
  }

  async findAll(): Promise<TransactionRecordResponse[]> {
    const [rows]: any = await this.connection.query(
      `SELECT transaction_id, type, gross_amount_etb, fee_deducted_etb, net_amount_etb,
              payment_network, status, recorded_at
       FROM financial_transactions_ledger
       ORDER BY recorded_at DESC
       LIMIT 500`,
    );
    return rows.map(mapTransactionRow);
  }

  async findBalanceByUserId(
    userId: string,
  ): Promise<WalletBalanceResponse | null> {
    const [rows]: any = await this.connection.execute(
      `SELECT wallet_id, user_id, available_balance_etb, escrowed_balance_etb,
              currency_code, updated_at
       FROM wallets WHERE user_id = ? LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) return null;

    return {
      wallet_id: rows[0].wallet_id,
      user_id: rows[0].user_id,
      available_balance_etb: toCash(rows[0].available_balance_etb),
      escrowed_balance_etb: toCash(rows[0].escrowed_balance_etb),
      currency_code: rows[0].currency_code,
      updated_at: new Date(rows[0].updated_at),
    };
  }

  async findTransactionsByUserId(
    userId: string,
    limit = 50,
  ): Promise<TransactionRecordResponse[]> {
    const [rows]: any = await this.connection.query(
      `SELECT transaction_id, type, gross_amount_etb, fee_deducted_etb, net_amount_etb,
              payment_network, status, recorded_at
       FROM financial_transactions_ledger
       WHERE user_id = ?
       ORDER BY recorded_at DESC
       LIMIT ?`,
      [userId, limit],
    );
    return rows.map(mapTransactionRow);
  }

  async findTransactionById(transactionId: string, userId?: string) {
    const params: any[] = [transactionId];
    let sql = `SELECT * FROM financial_transactions_ledger WHERE transaction_id = ?`;
    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }
    const [rows]: any = await this.connection.execute(`${sql} LIMIT 1`, params);
    return rows[0] ?? null;
  }

  async findTransactionByExternalReference(reference: string) {
    const [rows]: any = await this.connection.execute(
      `SELECT * FROM financial_transactions_ledger WHERE external_reference = ? LIMIT 1`,
      [reference],
    );
    return rows[0] ?? null;
  }

  async findTransactionByIdempotencyKey(key: string) {
    const [rows]: any = await this.connection.execute(
      `SELECT * FROM financial_transactions_ledger WHERE idempotency_key = ? LIMIT 1`,
      [key],
    );
    return rows[0] ?? null;
  }

  // -------------------------------------------------------------------------
  // Balance mutations. All require a transaction-scoped connection.
  // -------------------------------------------------------------------------

  /**
   * Locks and returns the wallet row.
   *
   * FOR UPDATE holds the lock until the surrounding transaction ends, which is
   * what prevents two concurrent orders from both passing a balance check
   * against the same funds.
   */
  async lockWallet(
    connection: PoolConnection,
    userId: string,
  ): Promise<{ wallet_id: string; available: number; escrowed: number }> {
    const [rows]: any = await connection.execute(
      `SELECT wallet_id, available_balance_etb, escrowed_balance_etb
       FROM wallets WHERE user_id = ? FOR UPDATE`,
      [userId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("WALLET_NOT_FOUND", "No wallet exists for this account.");
    }

    return {
      wallet_id: rows[0].wallet_id,
      available: toCash(rows[0].available_balance_etb),
      escrowed: toCash(rows[0].escrowed_balance_etb),
    };
  }

  async creditAvailable(
    connection: PoolConnection,
    userId: string,
    amountEtb: number,
  ): Promise<void> {
    await connection.execute(
      `UPDATE wallets
       SET available_balance_etb = available_balance_etb + ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [cashLiteral(amountEtb), userId],
    );
  }

  async debitAvailable(
    connection: PoolConnection,
    userId: string,
    amountEtb: number,
  ): Promise<void> {
    const wallet = await this.lockWallet(connection, userId);

    if (!cashGte(wallet.available, amountEtb)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_FUNDS",
        `Insufficient balance. Available: ${wallet.available.toFixed(2)} ETB, required: ${amountEtb.toFixed(2)} ETB.`,
      );
    }

    await connection.execute(
      `UPDATE wallets
       SET available_balance_etb = available_balance_etb - ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [cashLiteral(amountEtb), userId],
    );
  }

  /** Moves cash from spendable to escrowed and records why it is held. */
  async moveToEscrow(
    connection: PoolConnection,
    userId: string,
    amountEtb: number,
    reason: EscrowReason,
    referenceId: string,
  ): Promise<string> {
    const wallet = await this.lockWallet(connection, userId);

    if (!cashGte(wallet.available, amountEtb)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_FUNDS",
        `Insufficient balance. Available: ${wallet.available.toFixed(2)} ETB, required: ${amountEtb.toFixed(2)} ETB.`,
      );
    }

    await connection.execute(
      `UPDATE wallets
       SET available_balance_etb = available_balance_etb - ?,
           escrowed_balance_etb  = escrowed_balance_etb + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [cashLiteral(amountEtb), cashLiteral(amountEtb), userId],
    );

    await connection.execute(
      `INSERT INTO wallet_escrow_records (wallet_id, amount_etb, reason_code, reference_id)
       VALUES (?, ?, ?, ?)`,
      [wallet.wallet_id, cashLiteral(amountEtb), reason, referenceId],
    );

    return wallet.wallet_id;
  }

  /** Returns escrowed cash to the spendable balance (cancelled order, failed payout). */
  async releaseEscrow(
    connection: PoolConnection,
    userId: string,
    amountEtb: number,
    referenceId: string,
  ): Promise<void> {
    await connection.execute(
      `UPDATE wallets
       SET escrowed_balance_etb  = escrowed_balance_etb - ?,
           available_balance_etb = available_balance_etb + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [cashLiteral(amountEtb), cashLiteral(amountEtb), userId],
    );

    await this.closeEscrowRecord(connection, referenceId);
  }

  /** Consumes escrowed cash permanently (a trade settled, a payout cleared). */
  async spendEscrow(
    connection: PoolConnection,
    userId: string,
    amountEtb: number,
    referenceId: string,
  ): Promise<void> {
    await connection.execute(
      `UPDATE wallets
       SET escrowed_balance_etb = escrowed_balance_etb - ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [cashLiteral(amountEtb), userId],
    );

    await this.closeEscrowRecord(connection, referenceId);
  }

  private async closeEscrowRecord(
    connection: PoolConnection,
    referenceId: string,
  ): Promise<void> {
    await connection.execute(
      `UPDATE wallet_escrow_records
       SET released_or_spent = 1, updated_at = CURRENT_TIMESTAMP
       WHERE reference_id = ? AND released_or_spent = 0`,
      [referenceId],
    );
  }

  // -------------------------------------------------------------------------
  // Ledger
  // -------------------------------------------------------------------------

  async recordTransaction(
    connection: PoolConnection,
    entry: {
      transactionId: string;
      userId: string;
      walletId?: string | null;
      type: LedgerTransactionType;
      grossAmountEtb: number;
      feeDeductedEtb?: number;
      netAmountEtb: number;
      paymentNetwork?: string;
      status: LedgerStatus;
      idempotencyKey: string;
      externalReference?: string | null;
      settledAt?: Date | null;
    },
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO financial_transactions_ledger
        (transaction_id, user_id, wallet_id, type, gross_amount_etb, fee_deducted_etb,
         net_amount_etb, payment_network, status, idempotency_key, external_reference, settled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.transactionId,
        entry.userId,
        entry.walletId ?? null,
        entry.type,
        cashLiteral(entry.grossAmountEtb),
        cashLiteral(entry.feeDeductedEtb ?? 0),
        cashLiteral(entry.netAmountEtb),
        entry.paymentNetwork ?? "INTERNAL",
        entry.status,
        entry.idempotencyKey,
        entry.externalReference ?? null,
        entry.settledAt ?? null,
      ],
    );
  }

  async updateTransactionStatus(
    connection: PoolConnection,
    transactionId: string,
    status: LedgerStatus,
    options: { settledAt?: Date | null; failureReason?: string | null } = {},
  ): Promise<void> {
    await connection.execute(
      `UPDATE financial_transactions_ledger
       SET status = ?, settled_at = ?, failure_reason = ?
       WHERE transaction_id = ?`,
      [
        status,
        options.settledAt ?? (status === "SETTLED" ? new Date() : null),
        options.failureReason ?? null,
        transactionId,
      ],
    );
  }
}

function mapTransactionRow(row: any): TransactionRecordResponse {
  return {
    transaction_id: row.transaction_id,
    type: row.type,
    gross_amount_etb: toCash(row.gross_amount_etb),
    fee_deducted_etb: toCash(row.fee_deducted_etb),
    net_amount_etb: toCash(row.net_amount_etb),
    payment_network: row.payment_network,
    status: row.status,
    recorded_at: new Date(row.recorded_at),
  };
}
