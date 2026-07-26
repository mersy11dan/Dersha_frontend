import { PoolConnection } from "mysql2/promise";
import { SqlExecutor } from "./ParentRepository";
import { toShares, shareLiteral, cashLiteral, sharesGte } from "../utils/money";
import { ApiError } from "../utils/ApiError";

export type SecuritiesTransactionType =
  | "PRIMARY_ISSUANCE"
  | "P2P_TRADE"
  | "REDEMPTION"
  | "ASSET_LIQUIDATION"
  | "AMM_BUYBACK"
  | "BASKET_MINT"
  | "BASKET_DISSOLVE";

export interface ShareBalance {
  balance_id: string;
  owned: number;
  locked: number;
  /** Shares that may actually be sold or moved right now. */
  free: number;
}

/**
 * Share ownership and the immutable securities ledger.
 *
 * The balances table is the fast lookup; the ledger is the audit record. Both
 * are written in the same transaction, which is what lets the nightly
 * reconciliation job prove that the sum of the ledger equals the balances.
 */
export class SecuritiesRepository {
  constructor(private readonly connection: SqlExecutor) {}

  async getBalance(
    userId: string,
    subFundId: string,
  ): Promise<ShareBalance | null> {
    const [rows]: any = await this.connection.execute(
      `SELECT balance_id, shares_owned, locked_shares
       FROM sub_fund_balances WHERE user_id = ? AND sub_fund_id = ? LIMIT 1`,
      [userId, subFundId],
    );

    if (rows.length === 0) return null;

    const owned = toShares(rows[0].shares_owned);
    const locked = toShares(rows[0].locked_shares);
    return { balance_id: rows[0].balance_id, owned, locked, free: owned - locked };
  }

  /** Locks the balance row for the rest of the transaction. */
  async lockBalance(
    connection: PoolConnection,
    userId: string,
    subFundId: string,
  ): Promise<ShareBalance> {
    const [rows]: any = await connection.execute(
      `SELECT balance_id, shares_owned, locked_shares
       FROM sub_fund_balances WHERE user_id = ? AND sub_fund_id = ? FOR UPDATE`,
      [userId, subFundId],
    );

    if (rows.length === 0) {
      return { balance_id: "", owned: 0, locked: 0, free: 0 };
    }

    const owned = toShares(rows[0].shares_owned);
    const locked = toShares(rows[0].locked_shares);
    return { balance_id: rows[0].balance_id, owned, locked, free: owned - locked };
  }

  async creditShares(
    connection: PoolConnection,
    userId: string,
    subFundId: string,
    shares: number,
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO sub_fund_balances (user_id, sub_fund_id, shares_owned, locked_shares)
       VALUES (?, ?, ?, 0.000000)
       ON DUPLICATE KEY UPDATE shares_owned = shares_owned + VALUES(shares_owned)`,
      [userId, subFundId, shareLiteral(shares)],
    );
  }

  async debitShares(
    connection: PoolConnection,
    userId: string,
    subFundId: string,
    shares: number,
    options: { fromLocked?: boolean } = {},
  ): Promise<void> {
    const balance = await this.lockBalance(connection, userId, subFundId);

    // A sale draws on shares already locked as escrow for that order; anything
    // else must come out of the free float.
    const availableForDebit = options.fromLocked ? balance.locked : balance.free;

    if (!sharesGte(availableForDebit, shares)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_SHARES",
        `Insufficient shares. Available: ${availableForDebit}, required: ${shares}.`,
      );
    }

    await connection.execute(
      `UPDATE sub_fund_balances
       SET shares_owned = shares_owned - ?,
           locked_shares = locked_shares - ?
       WHERE user_id = ? AND sub_fund_id = ?`,
      [
        shareLiteral(shares),
        shareLiteral(options.fromLocked ? shares : 0),
        userId,
        subFundId,
      ],
    );
  }

  /** Reserves shares against an open sell order so they cannot be double-sold. */
  async lockShares(
    connection: PoolConnection,
    userId: string,
    subFundId: string,
    shares: number,
  ): Promise<void> {
    const balance = await this.lockBalance(connection, userId, subFundId);

    if (!sharesGte(balance.free, shares)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_SHARES",
        `You hold ${balance.free} unlocked shares but tried to commit ${shares}.`,
      );
    }

    await connection.execute(
      `UPDATE sub_fund_balances SET locked_shares = locked_shares + ?
       WHERE user_id = ? AND sub_fund_id = ?`,
      [shareLiteral(shares), userId, subFundId],
    );
  }

  async unlockShares(
    connection: PoolConnection,
    userId: string,
    subFundId: string,
    shares: number,
  ): Promise<void> {
    await connection.execute(
      `UPDATE sub_fund_balances
       SET locked_shares = GREATEST(locked_shares - ?, 0)
       WHERE user_id = ? AND sub_fund_id = ?`,
      [shareLiteral(shares), userId, subFundId],
    );
  }

  async recordLedgerEntry(
    connection: PoolConnection,
    entry: {
      subFundId: string;
      transactionType: SecuritiesTransactionType;
      senderUserId: string | null;
      receiverUserId: string | null;
      shares: number;
      pricePerShareEtb: number;
      idempotencyKey: string;
    },
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO sub_fund_securities_ledger
        (sub_fund_id, transaction_type, sender_user_id, receiver_user_id,
         shares_transferred, price_per_share_etb, total_value_etb, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.subFundId,
        entry.transactionType,
        entry.senderUserId,
        entry.receiverUserId,
        shareLiteral(entry.shares),
        cashLiteral(entry.pricePerShareEtb),
        cashLiteral(entry.shares * entry.pricePerShareEtb),
        entry.idempotencyKey,
      ],
    );
  }

  /**
   * Moves shares between two holders and records the ledger entry.
   * The single place share ownership changes hands, so settlement can never
   * credit one side without debiting the other.
   */
  async transferShares(
    connection: PoolConnection,
    input: {
      subFundId: string;
      fromUserId: string;
      toUserId: string;
      shares: number;
      pricePerShareEtb: number;
      transactionType: SecuritiesTransactionType;
      idempotencyKey: string;
      fromLocked?: boolean;
    },
  ): Promise<void> {
    await this.debitShares(
      connection,
      input.fromUserId,
      input.subFundId,
      input.shares,
      { fromLocked: input.fromLocked },
    );
    await this.creditShares(
      connection,
      input.toUserId,
      input.subFundId,
      input.shares,
    );
    await this.recordLedgerEntry(connection, {
      subFundId: input.subFundId,
      transactionType: input.transactionType,
      senderUserId: input.fromUserId,
      receiverUserId: input.toUserId,
      shares: input.shares,
      pricePerShareEtb: input.pricePerShareEtb,
      idempotencyKey: input.idempotencyKey,
    });
  }

  /** Holdings across every sub-fund, for the portfolio view. */
  async listHoldings(userId: string) {
    const [rows]: any = await this.connection.execute(
      `SELECT b.sub_fund_id,
              b.shares_owned,
              b.locked_shares,
              sf.nominal_price_per_share_etb,
              sf.current_net_asset_value_nav_etb,
              sf.total_issued_shares,
              sf.sub_fund_status,
              a.asset_id,
              a.asset_name,
              a.category,
              a.physical_location_description,
              a.independent_appraised_value_etb
       FROM sub_fund_balances b
       JOIN sub_funds sf ON sf.sub_fund_id = b.sub_fund_id
       JOIN assets_master a ON a.asset_id = sf.asset_id
       WHERE b.user_id = ? AND b.shares_owned > 0
       ORDER BY a.asset_name`,
      [userId],
    );
    return rows;
  }
}
