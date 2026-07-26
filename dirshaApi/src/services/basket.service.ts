import { randomUUID } from "node:crypto";
import { PoolConnection } from "mysql2/promise";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { SqlExecutor } from "../repository/ParentRepository";
import { BasketRepository } from "../repository/BasketRepository";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit } from "../repository/AuditRepository";
import {
  BasketListing,
  BasketMint,
  BasketPurchase,
} from "../schemas/basket.schema";
import { ApiError } from "../utils/ApiError";
import { SYSTEM_ACCOUNTS } from "../constants/systemAccounts";
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
import { reconciliationService } from "./reconciliation.service";

interface NavBreakdown {
  basket_id: string;
  nav_total_etb: number;
  nav_per_basket_share_etb: number;
  total_basket_shares: number;
  constituent_count: number;
  constituents: Array<{
    sub_fund_id: string;
    asset_name: string;
    category: string;
    shares_allocated: number;
    mark_price_etb: number;
    value_etb: number;
    weight_percentage: number;
  }>;
}

/** The price a constituent share is currently carried at. */
const markOf = (row: any): number =>
  toCash(row.current_net_asset_value_nav_etb) ||
  toCash(row.nominal_price_per_share_etb);

export class BasketService {
  /**
   * Flow 4 Steps 1 and 2. Mints a basket from shares the creator already owns.
   *
   * The constituent shares move into the custody pool rather than staying with
   * the creator: once basket shares are sold, the underlying stock can no longer
   * belong to whoever happened to assemble the wrapper, or a creator could sell
   * the basket and then sell its contents out from under the new holders.
   */
  async mint(
    creatorUserId: string,
    payload: BasketMint,
    context: Partial<RequestContext> = {},
  ) {
    const existing = await this.findByMintKey(payload.idempotency_key);
    if (existing) return this.get(existing.basket_id, creatorUserId);

    const subFundIds = payload.constituents.map((c) => c.sub_fund_id);
    if (new Set(subFundIds).size !== subFundIds.length) {
      throw ApiError.badRequest(
        "DUPLICATE_CONSTITUENT",
        "Each sub-fund may appear in a basket only once. Combine the allocations instead.",
      );
    }

    const basketId = randomUUID();
    const totalBasketShares = roundShares(payload.total_basket_shares);

    await withTransaction(async (connection) => {
      const securities = new SecuritiesRepository(connection);
      const baskets = new BasketRepository(connection);

      await connection.execute(
        `INSERT INTO custom_baskets
          (basket_id, creator_user_id, basket_name, lifecycle_status,
           total_basket_shares, creator_royalty_percentage, mint_idempotency_key)
         VALUES (?, ?, ?, 'MINTING', ?, 0.50, ?)`,
        [
          basketId,
          creatorUserId,
          payload.basket_name,
          shareLiteral(totalBasketShares),
          payload.idempotency_key,
        ],
      );

      for (const constituent of payload.constituents) {
        const shares = roundShares(constituent.shares_allocated);
        const subFund = await this.loadSubFundForLock(
          connection,
          constituent.sub_fund_id,
        );

        // Draws on the free float only, so vesting-locked and order-locked
        // shares cannot be wrapped into a basket.
        await securities.transferShares(connection, {
          subFundId: constituent.sub_fund_id,
          fromUserId: creatorUserId,
          toUserId: SYSTEM_ACCOUNTS.BASKET_CUSTODY_POOL,
          shares,
          pricePerShareEtb: markOf(subFund),
          transactionType: "BASKET_MINT",
          idempotencyKey: `BASKET-MINT-${basketId}-${constituent.sub_fund_id}`,
        });

        await connection.execute(
          `INSERT INTO custom_basket_constituents (basket_id, sub_fund_id, shares_allocated)
           VALUES (?, ?, ?)`,
          [basketId, constituent.sub_fund_id, shareLiteral(shares)],
        );
      }

      // The creator starts owning the entire supply; selling it is a separate step.
      await baskets.credit(connection, creatorUserId, basketId, totalBasketShares);

      await connection.execute(
        "UPDATE custom_baskets SET lifecycle_status = 'ACTIVE_PRIVATE' WHERE basket_id = ?",
        [basketId],
      );

      await this.writeNav(connection, basketId);

      await recordAudit(connection, {
        userId: creatorUserId,
        category: "BASKET",
        eventType: "BASKET_MINTED",
        referenceId: basketId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          basket_name: payload.basket_name,
          total_basket_shares: totalBasketShares,
          constituents: payload.constituents,
        },
      });
    });

    const basket = await this.get(basketId, creatorUserId);
    realtimeHub.publish("market", "basket_minted", {
      basket_id: basketId,
      basket_name: payload.basket_name,
      nav_per_basket_share_etb: basket.nav_per_basket_share_etb,
    });

    return basket;
  }

  /**
   * Flow 4 Step 3. Recomputes NAV from the live marks of the constituents.
   *
   * NAV is derived, never stored as a source of truth: the cached column and the
   * snapshot table are both projections of the constituent prices at a moment in
   * time, so a stale write can never silently misprice a basket.
   */
  async recalculateNav(basketId: string): Promise<NavBreakdown> {
    const nav = await withTransaction((connection) =>
      this.writeNav(connection, basketId),
    );
    this.publishNav(nav);
    return nav;
  }

  /** Refreshes every basket exposed to a sub-fund whose price just moved. */
  async recalculateForSubFund(subFundId: string): Promise<void> {
    const [rows]: any = await pool.execute(
      "SELECT DISTINCT basket_id FROM custom_basket_constituents WHERE sub_fund_id = ?",
      [subFundId],
    );

    for (const row of rows) {
      try {
        await this.recalculateNav(row.basket_id);
      } catch (error) {
        console.error(`[nav] recalculation failed for ${row.basket_id}`, error);
      }
    }
  }

  async recalculateAll(): Promise<number> {
    const [rows]: any = await pool.query(
      "SELECT basket_id FROM custom_baskets WHERE lifecycle_status <> 'DISSOLVED'",
    );

    let updated = 0;
    for (const row of rows) {
      try {
        await this.recalculateNav(row.basket_id);
        updated += 1;
      } catch (error) {
        console.error(`[nav] recalculation failed for ${row.basket_id}`, error);
      }
    }
    return updated;
  }

  /**
   * Flow 4 Step 4. Offers basket shares on the hybrid market.
   *
   * WHOLE_BASKET_ONLY keeps the wrapper intact for a single buyer;
   * FRACTIONAL_POOL is the fractionalisation path, where many buyers each take a
   * slice of the same listing.
   */
  async createListing(
    sellerUserId: string,
    basketId: string,
    payload: BasketListing,
    context: Partial<RequestContext> = {},
  ) {
    const existing = await this.findListingByKey(payload.idempotency_key);
    if (existing) return this.describeListing(existing.listing_id);

    const listingId = randomUUID();
    const shares = roundShares(payload.total_basket_shares_listed);
    const price = roundCash(payload.price_per_unit_etb);

    await withTransaction(async (connection) => {
      const baskets = new BasketRepository(connection);
      const basket = await this.loadBasketForUpdate(connection, basketId);

      if (basket.lifecycle_status === "DISSOLVED") {
        throw ApiError.conflict(
          "BASKET_DISSOLVED",
          "This basket has been dissolved and can no longer be listed.",
        );
      }

      await baskets.lockShares(connection, sellerUserId, basketId, shares);

      await connection.execute(
        `INSERT INTO basket_listings
          (listing_id, basket_id, seller_user_id, sale_mode, status,
           total_basket_shares_listed, filled_basket_shares, price_per_unit_etb, idempotency_key)
         VALUES (?, ?, ?, ?, 'OPEN', ?, 0.000000, ?, ?)`,
        [
          listingId,
          basketId,
          sellerUserId,
          payload.sale_mode,
          shareLiteral(shares),
          cashLiteral(price),
          payload.idempotency_key,
        ],
      );

      await connection.execute(
        "UPDATE custom_baskets SET lifecycle_status = 'LISTED_FOR_SALE' WHERE basket_id = ?",
        [basketId],
      );

      await recordAudit(connection, {
        userId: sellerUserId,
        category: "BASKET",
        eventType: "BASKET_LISTED",
        referenceId: listingId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          basket_id: basketId,
          sale_mode: payload.sale_mode,
          basket_shares: shares,
          price_per_unit_etb: price,
        },
      });
    });

    realtimeHub.publish("market", "basket_listed", {
      listing_id: listingId,
      basket_id: basketId,
      price_per_unit_etb: price,
    });

    return this.describeListing(listingId);
  }

  async cancelListing(sellerUserId: string, listingId: string) {
    await withTransaction(async (connection) => {
      const listing = await this.loadListingForUpdate(connection, listingId);

      if (listing.seller_user_id !== sellerUserId) {
        throw ApiError.forbidden(
          "NOT_LISTING_OWNER",
          "You can only cancel your own listings.",
        );
      }
      if (!["OPEN", "PARTIALLY_FILLED"].includes(listing.status)) {
        throw ApiError.conflict(
          "LISTING_NOT_CANCELLABLE",
          `This listing is already ${listing.status.toLowerCase().replace(/_/g, " ")}.`,
        );
      }

      const unsold = roundShares(
        toShares(listing.total_basket_shares_listed) -
          toShares(listing.filled_basket_shares),
      );

      const baskets = new BasketRepository(connection);
      await baskets.unlockShares(connection, sellerUserId, listing.basket_id, unsold);

      await connection.execute(
        "UPDATE basket_listings SET status = 'CANCELLED' WHERE listing_id = ?",
        [listingId],
      );

      await recordAudit(connection, {
        userId: sellerUserId,
        category: "BASKET",
        eventType: "BASKET_LISTING_CANCELLED",
        referenceId: listingId,
        payload: { released_basket_shares: unsold },
      });
    });

    return this.describeListing(listingId);
  }

  /**
   * Flow 4 Step 5. Buys basket shares and pays the creator their royalty.
   *
   * The royalty is taken out of the seller's proceeds rather than added to the
   * buyer's bill, so the advertised price is what the buyer actually pays, and
   * the creator keeps earning on a basket they no longer own.
   */
  async buy(
    buyerUserId: string,
    listingId: string,
    payload: BasketPurchase,
    context: Partial<RequestContext> = {},
  ) {
    const halt = await reconciliationService.getHaltState();
    if (halt.halted) {
      throw ApiError.serviceUnavailable(
        "TRADING_HALTED",
        halt.reason ||
          "Trading is temporarily suspended while the platform completes a ledger review.",
      );
    }

    const ledgerKey = `BASKET-BUY-${payload.idempotency_key}`;
    const settled = await this.findLedgerEntry(ledgerKey);
    if (settled) return this.describeListing(listingId);

    const requested = roundShares(payload.basket_shares);

    const receipt = await withTransaction(async (connection) => {
      const baskets = new BasketRepository(connection);
      const wallets = new WalletRepository(connection);

      const listing = await this.loadListingForUpdate(connection, listingId);
      const basket = await this.loadBasketForUpdate(connection, listing.basket_id);

      if (!["OPEN", "PARTIALLY_FILLED"].includes(listing.status)) {
        throw ApiError.conflict(
          "LISTING_UNAVAILABLE",
          "This listing is no longer accepting buyers.",
        );
      }
      if (listing.seller_user_id === buyerUserId) {
        throw ApiError.badRequest(
          "SELF_TRADE",
          "You cannot buy shares from your own listing.",
        );
      }

      const listed = toShares(listing.total_basket_shares_listed);
      const filled = toShares(listing.filled_basket_shares);
      const remaining = roundShares(listed - filled);

      if (listing.sale_mode === "WHOLE_BASKET_ONLY" && requested !== remaining) {
        throw ApiError.badRequest(
          "PARTIAL_PURCHASE_NOT_ALLOWED",
          `This basket is sold whole. Buy all ${remaining} basket shares or none.`,
        );
      }
      if (requested > remaining) {
        throw ApiError.badRequest(
          "INSUFFICIENT_LISTED_SHARES",
          `Only ${remaining} basket shares remain on this listing.`,
        );
      }

      const price = toCash(listing.price_per_unit_etb);
      const gross = roundCash(requested * price);
      const royaltyRate = Number(basket.creator_royalty_percentage) / 100;
      const royalty = roundCash(gross * royaltyRate);
      const sellerProceeds = roundCash(gross - royalty);

      await wallets.debitAvailable(connection, buyerUserId, gross);
      await wallets.creditAvailable(connection, listing.seller_user_id, sellerProceeds);
      if (royalty > 0) {
        await wallets.creditAvailable(connection, basket.creator_user_id, royalty);
      }

      await baskets.debit(
        connection,
        listing.seller_user_id,
        listing.basket_id,
        requested,
        { fromLocked: true },
      );
      await baskets.credit(connection, buyerUserId, listing.basket_id, requested);

      const newFilled = roundShares(filled + requested);
      const fullySold = newFilled >= listed;
      await connection.execute(
        `UPDATE basket_listings
         SET filled_basket_shares = ?, status = ?
         WHERE listing_id = ?`,
        [
          shareLiteral(newFilled),
          fullySold ? "FULLY_SOLD" : "PARTIALLY_FILLED",
          listingId,
        ],
      );

      const settlementId = randomUUID();
      await wallets.recordTransaction(connection, {
        transactionId: settlementId,
        userId: buyerUserId,
        type: "P2P_TRADE_SETTLEMENT",
        grossAmountEtb: gross,
        netAmountEtb: gross,
        status: "SETTLED",
        idempotencyKey: ledgerKey,
        settledAt: new Date(),
      });
      await wallets.recordTransaction(connection, {
        transactionId: randomUUID(),
        userId: listing.seller_user_id,
        type: "P2P_TRADE_SETTLEMENT",
        grossAmountEtb: gross,
        feeDeductedEtb: royalty,
        netAmountEtb: sellerProceeds,
        status: "SETTLED",
        idempotencyKey: `${ledgerKey}-SELLER`,
        settledAt: new Date(),
      });

      if (royalty > 0) {
        await wallets.recordTransaction(connection, {
          transactionId: randomUUID(),
          userId: basket.creator_user_id,
          type: "BASKET_ROYALTY",
          grossAmountEtb: royalty,
          netAmountEtb: royalty,
          status: "SETTLED",
          idempotencyKey: `${ledgerKey}-ROYALTY`,
          settledAt: new Date(),
        });

        await connection.execute(
          `INSERT INTO creator_royalty_ledger
            (basket_id, transaction_id, buyer_user_id, seller_user_id, creator_user_id,
             gross_volume_etb, royalty_fee_etb)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            listing.basket_id,
            settlementId,
            buyerUserId,
            listing.seller_user_id,
            basket.creator_user_id,
            cashLiteral(gross),
            cashLiteral(royalty),
          ],
        );
      }

      await recordAudit(connection, {
        userId: buyerUserId,
        category: "BASKET",
        eventType: "BASKET_SHARES_PURCHASED",
        referenceId: listingId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          basket_id: listing.basket_id,
          basket_shares: requested,
          price_per_unit_etb: price,
          gross_etb: gross,
          creator_royalty_etb: royalty,
          seller_proceeds_etb: sellerProceeds,
        },
      });

      return {
        basketId: listing.basket_id,
        shares: requested,
        price,
        gross,
        royalty,
        sellerProceeds,
      };
    });

    realtimeHub.publish(`basket:${receipt.basketId}`, "basket_trade", {
      basket_id: receipt.basketId,
      basket_shares: receipt.shares,
      price_per_unit_etb: receipt.price,
    });

    return {
      listing_id: listingId,
      basket_id: receipt.basketId,
      basket_shares_purchased: receipt.shares,
      price_per_unit_etb: receipt.price,
      gross_paid_etb: receipt.gross,
      creator_royalty_etb: receipt.royalty,
      seller_proceeds_etb: receipt.sellerProceeds,
    };
  }

  /**
   * Unwraps a basket, returning the custodied constituents to the holder.
   * Only possible for a holder of the entire supply, since a partial holder
   * cannot claim a specific share of an indivisible allocation.
   */
  async dissolve(userId: string, basketId: string) {
    return withTransaction(async (connection) => {
      const baskets = new BasketRepository(connection);
      const securities = new SecuritiesRepository(connection);

      const basket = await this.loadBasketForUpdate(connection, basketId);
      if (basket.lifecycle_status === "DISSOLVED") {
        throw ApiError.conflict("BASKET_DISSOLVED", "This basket is already dissolved.");
      }

      const totalSupply = toShares(basket.total_basket_shares);
      const balance = await baskets.lockBalanceRow(connection, userId, basketId);

      if (balance.free < totalSupply) {
        throw ApiError.badRequest(
          "PARTIAL_HOLDER",
          `Dissolving requires all ${totalSupply} basket shares free of listings; you hold ${balance.free}.`,
        );
      }

      const [constituents]: any = await connection.execute(
        `SELECT c.sub_fund_id, c.shares_allocated,
                sf.current_net_asset_value_nav_etb, sf.nominal_price_per_share_etb
         FROM custom_basket_constituents c
         JOIN sub_funds sf ON sf.sub_fund_id = c.sub_fund_id
         WHERE c.basket_id = ?`,
        [basketId],
      );

      for (const constituent of constituents) {
        await securities.transferShares(connection, {
          subFundId: constituent.sub_fund_id,
          fromUserId: SYSTEM_ACCOUNTS.BASKET_CUSTODY_POOL,
          toUserId: userId,
          shares: toShares(constituent.shares_allocated),
          pricePerShareEtb: markOf(constituent),
          transactionType: "BASKET_DISSOLVE",
          idempotencyKey: `BASKET-DISSOLVE-${basketId}-${constituent.sub_fund_id}`,
        });
      }

      await baskets.debit(connection, userId, basketId, totalSupply);
      await connection.execute(
        "UPDATE custom_baskets SET lifecycle_status = 'DISSOLVED' WHERE basket_id = ?",
        [basketId],
      );

      await recordAudit(connection, {
        userId,
        category: "BASKET",
        eventType: "BASKET_DISSOLVED",
        referenceId: basketId,
        payload: { returned_constituents: constituents.length },
      });

      return {
        basket_id: basketId,
        status: "DISSOLVED",
        returned_constituents: constituents.length,
      };
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /** Baskets the user created or holds shares in. */
  async listMine(userId: string) {
    const [rows]: any = await pool.execute(
      `SELECT b.basket_id, b.basket_name, b.creator_user_id, b.lifecycle_status,
              b.total_basket_shares, b.dynamic_basket_nav_etb,
              b.nav_last_calculated_at, b.creator_royalty_percentage, b.created_at,
              COALESCE(bal.basket_shares_owned, 0)  AS basket_shares_owned,
              COALESCE(bal.basket_shares_locked, 0) AS basket_shares_locked,
              (SELECT COUNT(*) FROM custom_basket_constituents c
                WHERE c.basket_id = b.basket_id) AS constituent_count
       FROM custom_baskets b
       LEFT JOIN custom_basket_balances bal
         ON bal.basket_id = b.basket_id AND bal.user_id = ?
       WHERE b.creator_user_id = ? OR bal.basket_shares_owned > 0
       ORDER BY b.created_at DESC`,
      [userId, userId],
    );

    return rows.map((row: any) => this.summariseBasket(row, userId));
  }

  /** Open listings across the hybrid market. */
  async listMarket(filters: { saleMode?: string } = {}) {
    const params: any[] = [];
    let sql = `
      SELECT l.listing_id, l.basket_id, l.seller_user_id, l.sale_mode, l.status,
             l.total_basket_shares_listed, l.filled_basket_shares,
             l.price_per_unit_etb, l.created_at,
             b.basket_name, b.creator_user_id, b.total_basket_shares,
             b.dynamic_basket_nav_etb, b.creator_royalty_percentage,
             u.full_name_raw AS seller_name,
             (SELECT COUNT(*) FROM custom_basket_constituents c
               WHERE c.basket_id = b.basket_id) AS constituent_count
      FROM basket_listings l
      JOIN custom_baskets b ON b.basket_id = l.basket_id
      JOIN users u ON u.user_id = l.seller_user_id
      WHERE l.status IN ('OPEN','PARTIALLY_FILLED')`;

    if (filters.saleMode) {
      sql += " AND l.sale_mode = ?";
      params.push(filters.saleMode);
    }

    sql += " ORDER BY l.created_at DESC LIMIT 100";

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((row: any) => this.summariseListing(row));
  }

  async get(basketId: string, viewerUserId?: string) {
    const [rows]: any = await pool.execute(
      `SELECT b.*, u.full_name_raw AS creator_name
       FROM custom_baskets b
       JOIN users u ON u.user_id = b.creator_user_id
       WHERE b.basket_id = ? LIMIT 1`,
      [basketId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("BASKET_NOT_FOUND", "No such basket.");
    }

    const nav = await this.computeNav(pool, basketId);
    const balance = viewerUserId
      ? await new BasketRepository(pool).getBalance(viewerUserId, basketId)
      : { owned: 0, locked: 0, free: 0 };

    const [listings]: any = await pool.execute(
      `SELECT listing_id, seller_user_id, sale_mode, status,
              total_basket_shares_listed, filled_basket_shares, price_per_unit_etb
       FROM basket_listings
       WHERE basket_id = ? AND status IN ('OPEN','PARTIALLY_FILLED')
       ORDER BY price_per_unit_etb`,
      [basketId],
    );

    const [history]: any = await pool.execute(
      `SELECT nav_total_etb, nav_per_basket_share_etb, calculated_at
       FROM basket_nav_snapshots
       WHERE basket_id = ?
       ORDER BY calculated_at DESC
       LIMIT 30`,
      [basketId],
    );

    return {
      basket_id: basketId,
      basket_name: rows[0].basket_name,
      creator_user_id: rows[0].creator_user_id,
      creator_name: rows[0].creator_name,
      is_creator: viewerUserId === rows[0].creator_user_id,
      lifecycle_status: rows[0].lifecycle_status,
      creator_royalty_percentage: Number(rows[0].creator_royalty_percentage),
      total_basket_shares: nav.total_basket_shares,
      nav_total_etb: nav.nav_total_etb,
      nav_per_basket_share_etb: nav.nav_per_basket_share_etb,
      nav_last_calculated_at: rows[0].nav_last_calculated_at,
      constituents: nav.constituents,
      my_basket_shares: balance.owned,
      my_locked_basket_shares: balance.locked,
      my_position_value_etb: roundCash(
        balance.owned * nav.nav_per_basket_share_etb,
      ),
      open_listings: listings.map((listing: any) => ({
        listing_id: listing.listing_id,
        sale_mode: listing.sale_mode,
        status: listing.status,
        basket_shares_remaining: roundShares(
          toShares(listing.total_basket_shares_listed) -
            toShares(listing.filled_basket_shares),
        ),
        price_per_unit_etb: toCash(listing.price_per_unit_etb),
        is_mine: listing.seller_user_id === viewerUserId,
      })),
      nav_history: history
        .map((point: any) => ({
          nav_total_etb: toCash(point.nav_total_etb),
          nav_per_basket_share_etb: toCash(point.nav_per_basket_share_etb),
          calculated_at: point.calculated_at,
        }))
        .reverse(),
    };
  }

  async describeListing(listingId: string) {
    const [rows]: any = await pool.execute(
      `SELECT l.*, b.basket_name, b.creator_user_id, b.total_basket_shares,
              b.dynamic_basket_nav_etb, b.creator_royalty_percentage,
              u.full_name_raw AS seller_name,
              (SELECT COUNT(*) FROM custom_basket_constituents c
                WHERE c.basket_id = b.basket_id) AS constituent_count
       FROM basket_listings l
       JOIN custom_baskets b ON b.basket_id = l.basket_id
       JOIN users u ON u.user_id = l.seller_user_id
       WHERE l.listing_id = ? LIMIT 1`,
      [listingId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("LISTING_NOT_FOUND", "No such basket listing.");
    }

    return this.summariseListing(rows[0]);
  }

  /** Royalties a creator has earned across all their baskets. */
  async royaltyEarnings(creatorUserId: string) {
    const [rows]: any = await pool.execute(
      `SELECT r.basket_id, b.basket_name,
              COUNT(*) AS trade_count,
              SUM(r.gross_volume_etb) AS gross_volume_etb,
              SUM(r.royalty_fee_etb)  AS royalty_earned_etb
       FROM creator_royalty_ledger r
       JOIN custom_baskets b ON b.basket_id = r.basket_id
       WHERE r.creator_user_id = ?
       GROUP BY r.basket_id, b.basket_name
       ORDER BY royalty_earned_etb DESC`,
      [creatorUserId],
    );

    return rows.map((row: any) => ({
      basket_id: row.basket_id,
      basket_name: row.basket_name,
      trade_count: Number(row.trade_count),
      gross_volume_etb: toCash(row.gross_volume_etb),
      royalty_earned_etb: toCash(row.royalty_earned_etb),
    }));
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async computeNav(
    executor: SqlExecutor,
    basketId: string,
  ): Promise<NavBreakdown> {
    const [basketRows]: any = await executor.execute(
      "SELECT total_basket_shares FROM custom_baskets WHERE basket_id = ? LIMIT 1",
      [basketId],
    );

    if (basketRows.length === 0) {
      throw ApiError.notFound("BASKET_NOT_FOUND", "No such basket.");
    }

    const [rows]: any = await executor.execute(
      `SELECT c.sub_fund_id, c.shares_allocated,
              sf.current_net_asset_value_nav_etb, sf.nominal_price_per_share_etb,
              a.asset_name, a.category
       FROM custom_basket_constituents c
       JOIN sub_funds sf ON sf.sub_fund_id = c.sub_fund_id
       JOIN assets_master a ON a.asset_id = sf.asset_id
       WHERE c.basket_id = ?`,
      [basketId],
    );

    const priced = rows.map((row: any) => {
      const shares = toShares(row.shares_allocated);
      const mark = markOf(row);
      return {
        sub_fund_id: row.sub_fund_id,
        asset_name: row.asset_name,
        category: row.category,
        shares_allocated: shares,
        mark_price_etb: mark,
        value_etb: roundCash(shares * mark),
      };
    });

    const navTotal = roundCash(
      priced.reduce((sum: number, item: any) => sum + item.value_etb, 0),
    );
    const totalBasketShares = toShares(basketRows[0].total_basket_shares);
    const navPerShare =
      totalBasketShares > 0 ? roundCash(navTotal / totalBasketShares) : 0;

    return {
      basket_id: basketId,
      nav_total_etb: navTotal,
      nav_per_basket_share_etb: navPerShare,
      total_basket_shares: totalBasketShares,
      constituent_count: priced.length,
      constituents: priced.map((item: any) => ({
        ...item,
        weight_percentage:
          navTotal > 0 ? Number(((item.value_etb / navTotal) * 100).toFixed(2)) : 0,
      })),
    };
  }

  /** Recomputes NAV and persists both the cached value and a snapshot. */
  private async writeNav(
    connection: PoolConnection,
    basketId: string,
  ): Promise<NavBreakdown> {
    const nav = await this.computeNav(connection, basketId);

    await connection.execute(
      `UPDATE custom_baskets
       SET dynamic_basket_nav_etb = ?, nav_last_calculated_at = CURRENT_TIMESTAMP
       WHERE basket_id = ?`,
      [cashLiteral(nav.nav_total_etb), basketId],
    );

    await connection.execute(
      `INSERT INTO basket_nav_snapshots
        (basket_id, nav_total_etb, nav_per_basket_share_etb, constituent_count)
       VALUES (?, ?, ?, ?)`,
      [
        basketId,
        cashLiteral(nav.nav_total_etb),
        cashLiteral(nav.nav_per_basket_share_etb),
        nav.constituent_count,
      ],
    );

    return nav;
  }

  private publishNav(nav: NavBreakdown) {
    realtimeHub.publish(`basket:${nav.basket_id}`, "nav", {
      basket_id: nav.basket_id,
      nav_total_etb: nav.nav_total_etb,
      nav_per_basket_share_etb: nav.nav_per_basket_share_etb,
      constituents: nav.constituents,
    });
  }

  private summariseBasket(row: any, viewerUserId: string) {
    const totalShares = toShares(row.total_basket_shares);
    const navTotal = toCash(row.dynamic_basket_nav_etb);
    const navPerShare = totalShares > 0 ? roundCash(navTotal / totalShares) : 0;
    const owned = toShares(row.basket_shares_owned);

    return {
      basket_id: row.basket_id,
      basket_name: row.basket_name,
      lifecycle_status: row.lifecycle_status,
      is_creator: row.creator_user_id === viewerUserId,
      creator_royalty_percentage: Number(row.creator_royalty_percentage),
      constituent_count: Number(row.constituent_count),
      total_basket_shares: totalShares,
      nav_total_etb: navTotal,
      nav_per_basket_share_etb: navPerShare,
      nav_last_calculated_at: row.nav_last_calculated_at,
      my_basket_shares: owned,
      my_locked_basket_shares: toShares(row.basket_shares_locked),
      my_position_value_etb: roundCash(owned * navPerShare),
      created_at: row.created_at,
    };
  }

  private summariseListing(row: any) {
    const totalShares = toShares(row.total_basket_shares);
    const navTotal = toCash(row.dynamic_basket_nav_etb);
    const navPerShare = totalShares > 0 ? roundCash(navTotal / totalShares) : 0;
    const price = toCash(row.price_per_unit_etb);
    const remaining = roundShares(
      toShares(row.total_basket_shares_listed) - toShares(row.filled_basket_shares),
    );

    return {
      listing_id: row.listing_id,
      basket_id: row.basket_id,
      basket_name: row.basket_name,
      seller_user_id: row.seller_user_id,
      seller_name: row.seller_name,
      sale_mode: row.sale_mode,
      status: row.status,
      constituent_count: Number(row.constituent_count),
      basket_shares_listed: toShares(row.total_basket_shares_listed),
      basket_shares_remaining: remaining,
      price_per_unit_etb: price,
      nav_per_basket_share_etb: navPerShare,
      // Positive means the listing is asking above the underlying value.
      premium_to_nav_percentage:
        navPerShare > 0
          ? Number((((price - navPerShare) / navPerShare) * 100).toFixed(2))
          : 0,
      creator_royalty_percentage: Number(row.creator_royalty_percentage),
      created_at: row.created_at,
    };
  }

  private async loadBasketForUpdate(connection: PoolConnection, basketId: string) {
    const [rows]: any = await connection.execute(
      "SELECT * FROM custom_baskets WHERE basket_id = ? FOR UPDATE",
      [basketId],
    );
    if (rows.length === 0) {
      throw ApiError.notFound("BASKET_NOT_FOUND", "No such basket.");
    }
    return rows[0];
  }

  private async loadListingForUpdate(connection: PoolConnection, listingId: string) {
    const [rows]: any = await connection.execute(
      "SELECT * FROM basket_listings WHERE listing_id = ? FOR UPDATE",
      [listingId],
    );
    if (rows.length === 0) {
      throw ApiError.notFound("LISTING_NOT_FOUND", "No such basket listing.");
    }
    return rows[0];
  }

  private async loadSubFundForLock(
    connection: PoolConnection,
    subFundId: string,
  ) {
    const [rows]: any = await connection.execute(
      `SELECT sub_fund_id, sub_fund_status, current_net_asset_value_nav_etb,
              nominal_price_per_share_etb
       FROM sub_funds WHERE sub_fund_id = ? LIMIT 1`,
      [subFundId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound(
        "SUB_FUND_NOT_FOUND",
        "One of the chosen sub-funds does not exist.",
      );
    }
    if (rows[0].sub_fund_status === "DISSOLVED") {
      throw ApiError.conflict(
        "SUB_FUND_DISSOLVED",
        "A dissolved sub-fund cannot be wrapped into a basket.",
      );
    }

    return rows[0];
  }

  private async findByMintKey(key: string) {
    const [rows]: any = await pool.execute(
      "SELECT basket_id FROM custom_baskets WHERE mint_idempotency_key = ? LIMIT 1",
      [key],
    );
    return rows[0] ?? null;
  }

  private async findListingByKey(key: string) {
    const [rows]: any = await pool.execute(
      "SELECT listing_id FROM basket_listings WHERE idempotency_key = ? LIMIT 1",
      [key],
    );
    return rows[0] ?? null;
  }

  private async findLedgerEntry(key: string) {
    const [rows]: any = await pool.execute(
      "SELECT transaction_id FROM financial_transactions_ledger WHERE idempotency_key = ? LIMIT 1",
      [key],
    );
    return rows[0] ?? null;
  }
}

export const basketService = new BasketService();
