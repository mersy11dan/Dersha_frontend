import { randomUUID } from "node:crypto";
import { PoolConnection } from "mysql2/promise";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit } from "../repository/AuditRepository";
import { matchingEngine, mapOrder } from "./matchingEngine";
import { OrderPlacement } from "../schemas/order.schema";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { SYSTEM_ACCOUNTS, PLATFORM_CONFIG_KEYS } from "../constants/systemAccounts";
import {
  cashLiteral,
  roundCash,
  roundShares,
  shareLiteral,
  toCash,
  toShares,
} from "../utils/money";
import { RequestContext } from "../utils/requestContext";
import { realtimeHub } from "../realtime/hub";
import { basketService } from "./basket.service";

export async function isTradingHalted(): Promise<{ halted: boolean; reason: string }> {
  const [rows]: any = await pool.execute(
    `SELECT config_key, config_value FROM platform_config
     WHERE config_key IN (?, ?)`,
    [PLATFORM_CONFIG_KEYS.TRADING_HALTED, PLATFORM_CONFIG_KEYS.HALT_REASON],
  );

  const config = Object.fromEntries(
    rows.map((row: any) => [row.config_key, row.config_value]),
  );

  return {
    halted: config[PLATFORM_CONFIG_KEYS.TRADING_HALTED] === "true",
    reason: config[PLATFORM_CONFIG_KEYS.HALT_REASON] ?? "",
  };
}

export class OrderService {
  /**
   * Flow 3 Steps 1 to 3. Escrows the order's collateral, writes it to the book,
   * and immediately attempts to match it.
   *
   * Escrow happens before matching, never after: a buy order that reaches the
   * book without its cash committed could be filled against funds the buyer has
   * already spent elsewhere.
   */
  async placeOrder(
    userId: string,
    payload: OrderPlacement,
    context: Partial<RequestContext> = {},
  ) {
    const halt = await isTradingHalted();
    if (halt.halted) {
      throw ApiError.serviceUnavailable(
        "TRADING_HALTED",
        halt.reason ||
          "Trading is temporarily suspended while the platform completes a ledger review.",
      );
    }

    const existing = await this.findByIdempotencyKey(payload.idempotency_key);
    if (existing) {
      return this.describeOrder(existing.order_id);
    }

    const shares = roundShares(payload.total_shares_ordered);
    const price = roundCash(payload.target_price_per_share_etb);
    const orderId = randomUUID();

    const result = await withTransaction(async (connection) => {
      const securities = new SecuritiesRepository(connection);
      const wallets = new WalletRepository(connection);

      const subFund = await this.loadTradableSubFund(connection, payload.sub_fund_id);

      if (payload.direction === "BUY") {
        // Reserve the maximum this order could ever cost.
        await wallets.moveToEscrow(
          connection,
          userId,
          roundCash(shares * price),
          "OPEN_BUY_LIMIT_ORDER",
          orderId,
        );
      } else {
        // Vesting-locked shares are already counted in locked_shares, so this
        // can only reserve genuinely free float.
        await securities.lockShares(connection, userId, payload.sub_fund_id, shares);
      }

      // A market sell that finds no counterparty becomes AMM-eligible once the
      // no-match window elapses.
      const ammEligibleAt =
        payload.order_type === "MARKET" && payload.direction === "SELL"
          ? new Date(Date.now() + env.economics.ammNoMatchWindowSeconds * 1000)
          : null;

      await connection.execute(
        `INSERT INTO orders
          (order_id, user_id, sub_fund_id, direction, order_type, status,
           total_shares_ordered, filled_shares_accumulated,
           target_price_per_share_etb, amm_eligible_at, idempotency_key)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 0.000000, ?, ?, ?)`,
        [
          orderId,
          userId,
          payload.sub_fund_id,
          payload.direction,
          payload.order_type,
          shareLiteral(shares),
          cashLiteral(price),
          ammEligibleAt,
          payload.idempotency_key,
        ],
      );

      const { fills, remaining } = await matchingEngine.match(connection, {
        order_id: orderId,
        user_id: userId,
        sub_fund_id: payload.sub_fund_id,
        direction: payload.direction,
        order_type: payload.order_type,
        total_shares_ordered: shares,
        filled_shares_accumulated: 0,
        target_price_per_share_etb: price,
        remaining: shares,
      });

      const filled = roundShares(shares - remaining);
      if (filled > 0) {
        await matchingEngine.applyFillToOrder(connection, orderId, filled);
      }

      await recordAudit(connection, {
        userId,
        category: "TRADING",
        eventType: "ORDER_PLACED",
        referenceId: orderId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          sub_fund_id: payload.sub_fund_id,
          direction: payload.direction,
          order_type: payload.order_type,
          shares,
          price_etb: price,
          immediately_filled: filled,
        },
      });

      return {
        orderId,
        fills,
        filled,
        remaining,
        subFundName: subFund.asset_name,
        ammEligibleAt,
      };
    });

    realtimeHub.publish(`subfund:${payload.sub_fund_id}`, "book", {
      sub_fund_id: payload.sub_fund_id,
    });

    // A trade moves the mark, which reprices every basket holding this sub-fund.
    // Deliberately after the commit: NAV is derived data, and recalculating it
    // inside the trade would make basket rows part of the settlement lock set.
    if (result.filled > 0) {
      void basketService
        .recalculateForSubFund(payload.sub_fund_id)
        .catch((error) => console.error("[nav] post-trade refresh failed", error));
    }

    return {
      order_id: result.orderId,
      sub_fund_id: payload.sub_fund_id,
      asset_name: result.subFundName,
      direction: payload.direction,
      order_type: payload.order_type,
      status:
        result.remaining <= 0
          ? "FILLED"
          : result.filled > 0
            ? "PARTIALLY_FILLED"
            : "PENDING",
      total_shares_ordered: shares,
      filled_shares: result.filled,
      remaining_shares: result.remaining,
      target_price_per_share_etb: price,
      fills: result.fills,
      amm_eligible_at: result.ammEligibleAt?.toISOString() ?? null,
    };
  }

  /** Releases whatever collateral the unfilled remainder is still holding. */
  async cancelOrder(userId: string, orderId: string) {
    return withTransaction(async (connection) => {
      const [rows]: any = await connection.execute(
        `SELECT * FROM orders WHERE order_id = ? AND user_id = ? FOR UPDATE`,
        [orderId, userId],
      );

      if (rows.length === 0) {
        throw ApiError.notFound("ORDER_NOT_FOUND", "No such order on this account.");
      }

      const order = mapOrder(rows[0]);

      if (rows[0].status === "FILLED" || rows[0].status === "CANCELLED") {
        throw ApiError.conflict(
          "ORDER_NOT_CANCELLABLE",
          `This order is already ${rows[0].status.toLowerCase()}.`,
        );
      }

      await this.releaseCollateral(connection, order);

      await connection.execute(
        "UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?",
        [orderId],
      );

      await recordAudit(connection, {
        userId,
        category: "TRADING",
        eventType: "ORDER_CANCELLED",
        referenceId: orderId,
        payload: { released_shares: order.remaining },
      });

      return {
        order_id: orderId,
        status: "CANCELLED",
        released_shares: order.remaining,
      };
    });
  }

  private async releaseCollateral(
    connection: PoolConnection,
    order: { order_id: string; user_id: string; sub_fund_id: string; direction: string; remaining: number; target_price_per_share_etb: number },
  ) {
    if (order.remaining <= 0) return;

    if (order.direction === "BUY") {
      const wallets = new WalletRepository(connection);
      await wallets.releaseEscrow(
        connection,
        order.user_id,
        roundCash(order.remaining * order.target_price_per_share_etb),
        order.order_id,
      );
    } else {
      const securities = new SecuritiesRepository(connection);
      await securities.unlockShares(
        connection,
        order.user_id,
        order.sub_fund_id,
        order.remaining,
      );
    }
  }

  /**
   * Flow 3 Step 4. The automated market maker absorbs sell orders that found no
   * counterparty inside the no-match window.
   *
   * The buyback price carries a haircut against the mark: the AMM is providing
   * immediate liquidity and taking on the inventory risk, and the discount is
   * what compensates the buffer for holding an asset nobody else bid on.
   */
  async runAmmBuybackSweep(): Promise<{
    processed: number;
    totalShares: number;
    totalPaidEtb: number;
  }> {
    const [candidates]: any = await pool.execute(
      `SELECT order_id FROM orders
       WHERE direction = 'SELL'
         AND order_type = 'MARKET'
         AND status IN ('PENDING','PARTIALLY_FILLED')
         AND amm_eligible_at IS NOT NULL
         AND amm_eligible_at <= NOW()`,
    );

    let processed = 0;
    let totalShares = 0;
    let totalPaidEtb = 0;

    for (const candidate of candidates) {
      try {
        const result = await this.executeAmmBuyback(candidate.order_id);
        if (result) {
          processed += 1;
          totalShares = roundShares(totalShares + result.shares);
          totalPaidEtb = roundCash(totalPaidEtb + result.paidEtb);
          await basketService.recalculateForSubFund(result.subFundId);
        }
      } catch (error) {
        console.error(
          `[amm] buyback failed for order ${candidate.order_id}`,
          error,
        );
      }
    }

    return { processed, totalShares, totalPaidEtb };
  }

  private async executeAmmBuyback(orderId: string) {
    return withTransaction(async (connection) => {
      const [rows]: any = await connection.execute(
        `SELECT * FROM orders WHERE order_id = ? FOR UPDATE`,
        [orderId],
      );

      if (rows.length === 0) return null;
      if (!["PENDING", "PARTIALLY_FILLED"].includes(rows[0].status)) return null;

      const order = mapOrder(rows[0]);
      if (order.remaining <= 0) return null;

      const securities = new SecuritiesRepository(connection);
      const wallets = new WalletRepository(connection);

      const [subFundRows]: any = await connection.execute(
        `SELECT current_net_asset_value_nav_etb, nominal_price_per_share_etb
         FROM sub_funds WHERE sub_fund_id = ? FOR UPDATE`,
        [order.sub_fund_id],
      );

      const mark =
        toCash(subFundRows[0]?.current_net_asset_value_nav_etb) ||
        toCash(subFundRows[0]?.nominal_price_per_share_etb);

      const buybackPrice = roundCash(mark * (1 - env.economics.ammHaircut));
      const payout = roundCash(order.remaining * buybackPrice);

      const ammWallet = await wallets.lockWallet(
        connection,
        SYSTEM_ACCOUNTS.AMM_LIQUIDITY_BUFFER,
      );

      if (ammWallet.available < payout) {
        console.warn(
          `[amm] buffer exhausted; cannot absorb order ${orderId} (needs ${payout} ETB)`,
        );
        return null;
      }

      await wallets.debitAvailable(
        connection,
        SYSTEM_ACCOUNTS.AMM_LIQUIDITY_BUFFER,
        payout,
      );
      await wallets.creditAvailable(connection, order.user_id, payout);

      await securities.transferShares(connection, {
        subFundId: order.sub_fund_id,
        fromUserId: order.user_id,
        toUserId: SYSTEM_ACCOUNTS.AMM_LIQUIDITY_BUFFER,
        shares: order.remaining,
        pricePerShareEtb: buybackPrice,
        transactionType: "AMM_BUYBACK",
        idempotencyKey: `AMM-${orderId}`,
        fromLocked: true,
      });

      const fillId = randomUUID();
      await connection.execute(
        `INSERT INTO trade_fills
          (fill_id, sub_fund_id, buy_order_id, sell_order_id, buyer_user_id, seller_user_id,
           shares_filled, price_per_share_etb, gross_value_etb, execution_type, idempotency_key)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'AMM_BUYBACK', ?)`,
        [
          fillId,
          order.sub_fund_id,
          orderId,
          SYSTEM_ACCOUNTS.AMM_LIQUIDITY_BUFFER,
          order.user_id,
          shareLiteral(order.remaining),
          cashLiteral(buybackPrice),
          cashLiteral(payout),
          `AMM-FILL-${fillId}`,
        ],
      );

      await wallets.recordTransaction(connection, {
        transactionId: randomUUID(),
        userId: order.user_id,
        type: "AMM_BUYBACK_PAYOUT",
        grossAmountEtb: payout,
        netAmountEtb: payout,
        status: "SETTLED",
        idempotencyKey: `AMM-PAYOUT-${orderId}`,
        settledAt: new Date(),
      });

      await matchingEngine.applyFillToOrder(connection, orderId, order.remaining);
      await connection.execute(
        "UPDATE orders SET status = 'FILLED', amm_eligible_at = NULL WHERE order_id = ?",
        [orderId],
      );

      await recordAudit(connection, {
        userId: order.user_id,
        category: "TRADING",
        eventType: "AMM_LIQUIDITY_BUYBACK",
        referenceId: orderId,
        payload: {
          shares: order.remaining,
          mark_price_etb: mark,
          haircut_percentage: env.economics.ammHaircut * 100,
          buyback_price_etb: buybackPrice,
          payout_etb: payout,
        },
      });

      realtimeHub.publish(`subfund:${order.sub_fund_id}`, "amm_buyback", {
        sub_fund_id: order.sub_fund_id,
        shares: order.remaining,
        price_etb: buybackPrice,
      });

      return {
        subFundId: order.sub_fund_id,
        shares: order.remaining,
        paidEtb: payout,
        buybackPrice,
      };
    });
  }

  async listOrders(userId: string, status?: string) {
    const params: any[] = [userId];
    let sql = `
      SELECT o.order_id, o.sub_fund_id, o.direction, o.order_type, o.status,
             o.total_shares_ordered, o.filled_shares_accumulated,
             o.target_price_per_share_etb, o.amm_eligible_at, o.created_at,
             a.asset_name
      FROM orders o
      JOIN sub_funds sf ON sf.sub_fund_id = o.sub_fund_id
      JOIN assets_master a ON a.asset_id = sf.asset_id
      WHERE o.user_id = ?`;

    if (status) {
      sql += " AND o.status = ?";
      params.push(status);
    }

    sql += " ORDER BY o.created_at DESC LIMIT 100";

    const [rows]: any = await pool.execute(sql, params);

    return rows.map((row: any) => ({
      ...row,
      total_shares_ordered: toShares(row.total_shares_ordered),
      filled_shares_accumulated: toShares(row.filled_shares_accumulated),
      target_price_per_share_etb: toCash(row.target_price_per_share_etb),
    }));
  }

  async describeOrder(orderId: string) {
    const [rows]: any = await pool.execute(
      `SELECT o.*, a.asset_name
       FROM orders o
       JOIN sub_funds sf ON sf.sub_fund_id = o.sub_fund_id
       JOIN assets_master a ON a.asset_id = sf.asset_id
       WHERE o.order_id = ? LIMIT 1`,
      [orderId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("ORDER_NOT_FOUND", "No such order.");
    }

    const order = mapOrder(rows[0]);
    const [fills]: any = await pool.execute(
      `SELECT fill_id, shares_filled, price_per_share_etb, gross_value_etb,
              execution_type, executed_at
       FROM trade_fills
       WHERE buy_order_id = ? OR sell_order_id = ?
       ORDER BY executed_at`,
      [orderId, orderId],
    );

    return {
      order_id: order.order_id,
      sub_fund_id: order.sub_fund_id,
      asset_name: rows[0].asset_name,
      direction: order.direction,
      order_type: order.order_type,
      status: rows[0].status,
      total_shares_ordered: order.total_shares_ordered,
      filled_shares: order.filled_shares_accumulated,
      remaining_shares: order.remaining,
      target_price_per_share_etb: order.target_price_per_share_etb,
      amm_eligible_at: rows[0].amm_eligible_at,
      fills: fills.map((fill: any) => ({
        fill_id: fill.fill_id,
        shares: toShares(fill.shares_filled),
        price_per_share_etb: toCash(fill.price_per_share_etb),
        gross_value_etb: toCash(fill.gross_value_etb),
        execution_type: fill.execution_type,
        executed_at: fill.executed_at,
      })),
    };
  }

  private async findByIdempotencyKey(key: string) {
    const [rows]: any = await pool.execute(
      "SELECT order_id FROM orders WHERE idempotency_key = ? LIMIT 1",
      [key],
    );
    return rows[0] ?? null;
  }

  private async loadTradableSubFund(
    connection: PoolConnection,
    subFundId: string,
  ) {
    const [rows]: any = await connection.execute(
      `SELECT sf.sub_fund_id, sf.sub_fund_status, a.asset_name
       FROM sub_funds sf
       JOIN assets_master a ON a.asset_id = sf.asset_id
       WHERE sf.sub_fund_id = ? LIMIT 1`,
      [subFundId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("SUB_FUND_NOT_FOUND", "No such sub-fund.");
    }

    if (rows[0].sub_fund_status === "DISSOLVED") {
      throw ApiError.conflict(
        "SUB_FUND_DISSOLVED",
        "This sub-fund has been dissolved and can no longer be traded.",
      );
    }

    return rows[0];
  }
}

export const orderService = new OrderService();
