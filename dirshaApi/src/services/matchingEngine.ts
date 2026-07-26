import { randomUUID } from "node:crypto";
import { PoolConnection } from "mysql2/promise";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit } from "../repository/AuditRepository";
import { realtimeHub } from "../realtime/hub";
import { roundCash, roundShares, toCash, toShares, cashLiteral, shareLiteral } from "../utils/money";

export interface RestingOrder {
  order_id: string;
  user_id: string;
  sub_fund_id: string;
  direction: "BUY" | "SELL";
  order_type: "LIMIT" | "MARKET";
  total_shares_ordered: number;
  filled_shares_accumulated: number;
  target_price_per_share_etb: number;
  remaining: number;
}

export interface Fill {
  fill_id: string;
  shares: number;
  price_per_share_etb: number;
  gross_value_etb: number;
  counterparty_order_id: string;
  buyer_user_id: string;
  seller_user_id: string;
}

function mapOrder(row: any): RestingOrder {
  const total = toShares(row.total_shares_ordered);
  const filled = toShares(row.filled_shares_accumulated);
  return {
    order_id: row.order_id,
    user_id: row.user_id,
    sub_fund_id: row.sub_fund_id,
    direction: row.direction,
    order_type: row.order_type,
    total_shares_ordered: total,
    filled_shares_accumulated: filled,
    target_price_per_share_etb: toCash(row.target_price_per_share_etb),
    remaining: roundShares(total - filled),
  };
}

/**
 * Price-time priority matching engine.
 *
 * Runs in-process behind this interface, taking its atomicity from
 * `SELECT ... FOR UPDATE` inside the caller's transaction rather than from an
 * external queue. Swapping in Redis later means reimplementing
 * `loadOppositeBook` and nothing else.
 */
export class MatchingEngine {
  /**
   * Loads and locks the opposite side of the book.
   *
   * Best price first, then oldest first, which is what makes the queue fair:
   * two orders at the same price are filled in the order they arrived.
   */
  private async loadOppositeBook(
    connection: PoolConnection,
    incoming: RestingOrder,
  ): Promise<RestingOrder[]> {
    const isBuy = incoming.direction === "BUY";

    const [rows]: any = await connection.execute(
      `SELECT order_id, user_id, sub_fund_id, direction, order_type,
              total_shares_ordered, filled_shares_accumulated,
              target_price_per_share_etb, created_at
       FROM orders
       WHERE sub_fund_id = ?
         AND direction = ?
         AND status IN ('PENDING','PARTIALLY_FILLED')
         AND user_id <> ?
         AND ${isBuy ? "target_price_per_share_etb <= ?" : "target_price_per_share_etb >= ?"}
       ORDER BY target_price_per_share_etb ${isBuy ? "ASC" : "DESC"}, created_at ASC
       FOR UPDATE`,
      [
        incoming.sub_fund_id,
        isBuy ? "SELL" : "BUY",
        incoming.user_id,
        cashLiteral(incoming.target_price_per_share_etb),
      ],
    );

    return rows.map(mapOrder);
  }

  /**
   * Matches an incoming order against the book and settles every fill.
   *
   * Each fill moves shares and cash in the same transaction as the order status
   * update, so the book can never show a fill that did not settle.
   */
  async match(
    connection: PoolConnection,
    incoming: RestingOrder,
  ): Promise<{ fills: Fill[]; remaining: number }> {
    const securities = new SecuritiesRepository(connection);
    const wallets = new WalletRepository(connection);
    const fills: Fill[] = [];

    let remaining = incoming.remaining;
    const book = await this.loadOppositeBook(connection, incoming);

    for (const resting of book) {
      if (remaining <= 0) break;

      const shares = roundShares(Math.min(remaining, resting.remaining));
      if (shares <= 0) continue;

      // The resting order sets the price. It was there first, so it earns the
      // better side of any spread.
      const price = resting.target_price_per_share_etb;
      const grossValue = roundCash(shares * price);

      const buyerOrder = incoming.direction === "BUY" ? incoming : resting;
      const sellerOrder = incoming.direction === "BUY" ? resting : incoming;

      // The buyer escrowed cash at their own limit price. If they are filled
      // cheaper, the difference is theirs and goes straight back to available.
      const escrowedPerShare = buyerOrder.target_price_per_share_etb;
      const escrowedForFill = roundCash(shares * escrowedPerShare);
      const refund = roundCash(escrowedForFill - grossValue);

      await wallets.spendEscrow(
        connection,
        buyerOrder.user_id,
        escrowedForFill,
        buyerOrder.order_id,
      );

      if (refund > 0) {
        await wallets.creditAvailable(connection, buyerOrder.user_id, refund);
      }

      await wallets.creditAvailable(connection, sellerOrder.user_id, grossValue);

      await securities.transferShares(connection, {
        subFundId: incoming.sub_fund_id,
        fromUserId: sellerOrder.user_id,
        toUserId: buyerOrder.user_id,
        shares,
        pricePerShareEtb: price,
        transactionType: "P2P_TRADE",
        idempotencyKey: `FILL-${buyerOrder.order_id}-${sellerOrder.order_id}-${fills.length}`,
        fromLocked: true,
      });

      const fillId = randomUUID();
      await connection.execute(
        `INSERT INTO trade_fills
          (fill_id, sub_fund_id, buy_order_id, sell_order_id, buyer_user_id, seller_user_id,
           shares_filled, price_per_share_etb, gross_value_etb, execution_type, idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'P2P_CLOB', ?)`,
        [
          fillId,
          incoming.sub_fund_id,
          buyerOrder.order_id,
          sellerOrder.order_id,
          buyerOrder.user_id,
          sellerOrder.user_id,
          shareLiteral(shares),
          cashLiteral(price),
          cashLiteral(grossValue),
          `FILL-${fillId}`,
        ],
      );

      await this.recordCashLegs(connection, {
        buyerUserId: buyerOrder.user_id,
        sellerUserId: sellerOrder.user_id,
        grossValue,
        fillId,
      });

      await this.applyFillToOrder(connection, resting.order_id, shares);
      remaining = roundShares(remaining - shares);

      fills.push({
        fill_id: fillId,
        shares,
        price_per_share_etb: price,
        gross_value_etb: grossValue,
        counterparty_order_id: resting.order_id,
        buyer_user_id: buyerOrder.user_id,
        seller_user_id: sellerOrder.user_id,
      });
    }

    if (fills.length > 0) {
      const lastPrice = fills[fills.length - 1].price_per_share_etb;
      await this.updateMarkPrice(connection, incoming.sub_fund_id, lastPrice);

      await recordAudit(connection, {
        userId: incoming.user_id,
        category: "TRADING",
        eventType: "ORDER_MATCHED",
        referenceId: incoming.order_id,
        payload: {
          fills: fills.length,
          shares_filled: roundShares(incoming.remaining - remaining),
          last_price_etb: lastPrice,
        },
      });
    }

    return { fills, remaining };
  }

  /** Both sides of a trade get a cash ledger row, so statements balance. */
  private async recordCashLegs(
    connection: PoolConnection,
    input: {
      buyerUserId: string;
      sellerUserId: string;
      grossValue: number;
      fillId: string;
    },
  ) {
    const wallets = new WalletRepository(connection);

    await wallets.recordTransaction(connection, {
      transactionId: randomUUID(),
      userId: input.buyerUserId,
      type: "P2P_TRADE_SETTLEMENT",
      grossAmountEtb: input.grossValue,
      netAmountEtb: -input.grossValue,
      status: "SETTLED",
      idempotencyKey: `TRADE-BUY-${input.fillId}`,
      settledAt: new Date(),
    });

    await wallets.recordTransaction(connection, {
      transactionId: randomUUID(),
      userId: input.sellerUserId,
      type: "P2P_TRADE_SETTLEMENT",
      grossAmountEtb: input.grossValue,
      netAmountEtb: input.grossValue,
      status: "SETTLED",
      idempotencyKey: `TRADE-SELL-${input.fillId}`,
      settledAt: new Date(),
    });
  }

  async applyFillToOrder(
    connection: PoolConnection,
    orderId: string,
    shares: number,
  ): Promise<void> {
    await connection.execute(
      `UPDATE orders
       SET filled_shares_accumulated = filled_shares_accumulated + ?,
           status = CASE
             WHEN filled_shares_accumulated + ? >= total_shares_ordered THEN 'FILLED'
             ELSE 'PARTIALLY_FILLED'
           END
       WHERE order_id = ?`,
      [shareLiteral(shares), shareLiteral(shares), orderId],
    );
  }

  /**
   * The last traded price becomes the sub-fund's mark, which is what baskets
   * value their constituents at and what the AMM haircuts against.
   */
  async updateMarkPrice(
    connection: PoolConnection,
    subFundId: string,
    price: number,
  ): Promise<void> {
    await connection.execute(
      `UPDATE sub_funds SET current_net_asset_value_nav_etb = ? WHERE sub_fund_id = ?`,
      [cashLiteral(price), subFundId],
    );

    realtimeHub.publish(`subfund:${subFundId}`, "price", {
      sub_fund_id: subFundId,
      price_etb: price,
    });
    realtimeHub.publish("market", "price", {
      sub_fund_id: subFundId,
      price_etb: price,
    });
  }
}

export const matchingEngine = new MatchingEngine();
export { mapOrder };
