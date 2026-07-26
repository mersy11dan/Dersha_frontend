import { PoolConnection } from "mysql2/promise";
import { SqlExecutor } from "./ParentRepository";
import { toShares, shareLiteral, sharesGte } from "../utils/money";
import { ApiError } from "../utils/ApiError";

export interface BasketShareBalance {
  owned: number;
  locked: number;
  /** Basket shares that can be listed or sold right now. */
  free: number;
}

/**
 * Ownership of basket shares.
 *
 * Mirrors SecuritiesRepository: the owned/locked split is what lets an open
 * listing reserve supply without removing it from the seller's holdings.
 */
export class BasketRepository {
  constructor(private readonly connection: SqlExecutor) {}

  async getBalance(userId: string, basketId: string): Promise<BasketShareBalance> {
    const [rows]: any = await this.connection.execute(
      `SELECT basket_shares_owned, basket_shares_locked
       FROM custom_basket_balances
       WHERE user_id = ? AND basket_id = ? LIMIT 1`,
      [userId, basketId],
    );
    return mapBalance(rows[0]);
  }

  async lockBalanceRow(
    connection: PoolConnection,
    userId: string,
    basketId: string,
  ): Promise<BasketShareBalance> {
    const [rows]: any = await connection.execute(
      `SELECT basket_shares_owned, basket_shares_locked
       FROM custom_basket_balances
       WHERE user_id = ? AND basket_id = ? FOR UPDATE`,
      [userId, basketId],
    );
    return mapBalance(rows[0]);
  }

  async credit(
    connection: PoolConnection,
    userId: string,
    basketId: string,
    shares: number,
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO custom_basket_balances
        (user_id, basket_id, basket_shares_owned, basket_shares_locked)
       VALUES (?, ?, ?, 0.000000)
       ON DUPLICATE KEY UPDATE
         basket_shares_owned = basket_shares_owned + VALUES(basket_shares_owned)`,
      [userId, basketId, shareLiteral(shares)],
    );
  }

  async debit(
    connection: PoolConnection,
    userId: string,
    basketId: string,
    shares: number,
    options: { fromLocked?: boolean } = {},
  ): Promise<void> {
    const balance = await this.lockBalanceRow(connection, userId, basketId);
    const availableForDebit = options.fromLocked ? balance.locked : balance.free;

    if (!sharesGte(availableForDebit, shares)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_BASKET_SHARES",
        `Insufficient basket shares. Available: ${availableForDebit}, required: ${shares}.`,
      );
    }

    await connection.execute(
      `UPDATE custom_basket_balances
       SET basket_shares_owned  = basket_shares_owned - ?,
           basket_shares_locked = basket_shares_locked - ?
       WHERE user_id = ? AND basket_id = ?`,
      [
        shareLiteral(shares),
        shareLiteral(options.fromLocked ? shares : 0),
        userId,
        basketId,
      ],
    );
  }

  async lockShares(
    connection: PoolConnection,
    userId: string,
    basketId: string,
    shares: number,
  ): Promise<void> {
    const balance = await this.lockBalanceRow(connection, userId, basketId);

    if (!sharesGte(balance.free, shares)) {
      throw ApiError.badRequest(
        "INSUFFICIENT_BASKET_SHARES",
        `You hold ${balance.free} unlisted basket shares but tried to list ${shares}.`,
      );
    }

    await connection.execute(
      `UPDATE custom_basket_balances
       SET basket_shares_locked = basket_shares_locked + ?
       WHERE user_id = ? AND basket_id = ?`,
      [shareLiteral(shares), userId, basketId],
    );
  }

  async unlockShares(
    connection: PoolConnection,
    userId: string,
    basketId: string,
    shares: number,
  ): Promise<void> {
    await connection.execute(
      `UPDATE custom_basket_balances
       SET basket_shares_locked = GREATEST(basket_shares_locked - ?, 0)
       WHERE user_id = ? AND basket_id = ?`,
      [shareLiteral(shares), userId, basketId],
    );
  }

  /** Every holder of a basket, used to fan yield out to basket constituents. */
  async listHolders(basketId: string) {
    const [rows]: any = await this.connection.execute(
      `SELECT user_id, basket_shares_owned
       FROM custom_basket_balances
       WHERE basket_id = ? AND basket_shares_owned > 0`,
      [basketId],
    );
    return rows.map((row: any) => ({
      user_id: row.user_id as string,
      shares: toShares(row.basket_shares_owned),
    }));
  }
}

function mapBalance(row: any): BasketShareBalance {
  const owned = toShares(row?.basket_shares_owned);
  const locked = toShares(row?.basket_shares_locked);
  return { owned, locked, free: owned - locked };
}
