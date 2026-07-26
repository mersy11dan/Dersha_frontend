import pool from "../database/database.config";
import { ApiError } from "../utils/ApiError";
import { toCash, toShares, roundCash } from "../utils/money";

export interface MarketFilters {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
}

export class MarketService {
  /**
   * The tradable universe: every tokenized asset with its live mark and a
   * 24-hour price change derived from the fills table.
   */
  async listSubFunds(filters: MarketFilters = {}) {
    const clauses = ["sf.sub_fund_status <> 'DISSOLVED'"];
    const params: any[] = [];

    if (filters.category) {
      clauses.push("a.category = ?");
      params.push(filters.category);
    }

    if (filters.status) {
      clauses.push("sf.sub_fund_status = ?");
      params.push(filters.status);
    }

    if (filters.search) {
      clauses.push("(a.asset_name LIKE ? OR a.physical_location_description LIKE ?)");
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows]: any = await pool.execute(
      `SELECT sf.sub_fund_id, sf.sub_fund_status, sf.total_issued_shares,
              sf.nominal_price_per_share_etb, sf.current_net_asset_value_nav_etb,
              a.asset_id, a.asset_name, a.category, a.physical_location_description,
              a.independent_appraised_value_etb, a.custodian_bank_name,
              COALESCE(pool_balance.shares_owned, 0) AS offering_shares_remaining,
              (SELECT MIN(o.target_price_per_share_etb) FROM orders o
                WHERE o.sub_fund_id = sf.sub_fund_id AND o.direction = 'SELL'
                  AND o.status IN ('PENDING','PARTIALLY_FILLED')) AS best_ask_etb,
              (SELECT MAX(o.target_price_per_share_etb) FROM orders o
                WHERE o.sub_fund_id = sf.sub_fund_id AND o.direction = 'BUY'
                  AND o.status IN ('PENDING','PARTIALLY_FILLED')) AS best_bid_etb,
              (SELECT SUM(f.gross_value_etb) FROM trade_fills f
                WHERE f.sub_fund_id = sf.sub_fund_id
                  AND f.executed_at >= NOW() - INTERVAL 24 HOUR) AS volume_24h_etb,
              (SELECT f.price_per_share_etb FROM trade_fills f
                WHERE f.sub_fund_id = sf.sub_fund_id
                  AND f.executed_at <= NOW() - INTERVAL 24 HOUR
                ORDER BY f.executed_at DESC LIMIT 1) AS price_24h_ago_etb
       FROM sub_funds sf
       JOIN assets_master a ON a.asset_id = sf.asset_id
       LEFT JOIN sub_fund_balances pool_balance
         ON pool_balance.sub_fund_id = sf.sub_fund_id
        AND pool_balance.user_id = '00000000-0000-4000-8000-000000000001'
       WHERE ${clauses.join(" AND ")}
       ORDER BY a.asset_name`,
      params,
    );

    return rows.map((row: any) => this.decorate(row));
  }

  async getSubFund(subFundId: string) {
    const [rows]: any = await pool.execute(
      `SELECT sf.sub_fund_id, sf.sub_fund_status, sf.total_issued_shares,
              sf.nominal_price_per_share_etb, sf.current_net_asset_value_nav_etb,
              a.asset_id, a.asset_name, a.category, a.physical_location_description,
              a.independent_appraised_value_etb, a.custodian_bank_name,
              a.last_appraisal_date,
              COALESCE(pool_balance.shares_owned, 0) AS offering_shares_remaining,
              (SELECT MIN(o.target_price_per_share_etb) FROM orders o
                WHERE o.sub_fund_id = sf.sub_fund_id AND o.direction = 'SELL'
                  AND o.status IN ('PENDING','PARTIALLY_FILLED')) AS best_ask_etb,
              (SELECT MAX(o.target_price_per_share_etb) FROM orders o
                WHERE o.sub_fund_id = sf.sub_fund_id AND o.direction = 'BUY'
                  AND o.status IN ('PENDING','PARTIALLY_FILLED')) AS best_bid_etb,
              (SELECT SUM(f.gross_value_etb) FROM trade_fills f
                WHERE f.sub_fund_id = sf.sub_fund_id
                  AND f.executed_at >= NOW() - INTERVAL 24 HOUR) AS volume_24h_etb,
              (SELECT f.price_per_share_etb FROM trade_fills f
                WHERE f.sub_fund_id = sf.sub_fund_id
                  AND f.executed_at <= NOW() - INTERVAL 24 HOUR
                ORDER BY f.executed_at DESC LIMIT 1) AS price_24h_ago_etb
       FROM sub_funds sf
       JOIN assets_master a ON a.asset_id = sf.asset_id
       LEFT JOIN sub_fund_balances pool_balance
         ON pool_balance.sub_fund_id = sf.sub_fund_id
        AND pool_balance.user_id = '00000000-0000-4000-8000-000000000001'
       WHERE sf.sub_fund_id = ? LIMIT 1`,
      [subFundId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("SUB_FUND_NOT_FOUND", "No such sub-fund.");
    }

    const [recentFills]: any = await pool.execute(
      `SELECT shares_filled, price_per_share_etb, execution_type, executed_at
       FROM trade_fills WHERE sub_fund_id = ?
       ORDER BY executed_at DESC LIMIT 30`,
      [subFundId],
    );

    return {
      ...this.decorate(rows[0]),
      recent_trades: recentFills.map((fill: any) => ({
        shares: toShares(fill.shares_filled),
        price_per_share_etb: toCash(fill.price_per_share_etb),
        execution_type: fill.execution_type,
        executed_at: fill.executed_at,
      })),
    };
  }

  /**
   * Aggregated depth. Individual orders are collapsed into price levels so the
   * book never reveals who is behind a given bid.
   */
  async getOrderBook(subFundId: string, depth = 15) {
    const [bids]: any = await pool.execute(
      `SELECT target_price_per_share_etb AS price,
              SUM(total_shares_ordered - filled_shares_accumulated) AS shares,
              COUNT(*) AS order_count
       FROM orders
       WHERE sub_fund_id = ? AND direction = 'BUY'
         AND status IN ('PENDING','PARTIALLY_FILLED')
       GROUP BY target_price_per_share_etb
       ORDER BY price DESC
       LIMIT ?`,
      [subFundId, depth],
    );

    const [asks]: any = await pool.execute(
      `SELECT target_price_per_share_etb AS price,
              SUM(total_shares_ordered - filled_shares_accumulated) AS shares,
              COUNT(*) AS order_count
       FROM orders
       WHERE sub_fund_id = ? AND direction = 'SELL'
         AND status IN ('PENDING','PARTIALLY_FILLED')
       GROUP BY target_price_per_share_etb
       ORDER BY price ASC
       LIMIT ?`,
      [subFundId, depth],
    );

    const mapLevel = (row: any) => ({
      price_etb: toCash(row.price),
      shares: toShares(row.shares),
      order_count: Number(row.order_count),
      total_value_etb: roundCash(toCash(row.price) * toShares(row.shares)),
    });

    const bidLevels = bids.map(mapLevel).filter((l: any) => l.shares > 0);
    const askLevels = asks.map(mapLevel).filter((l: any) => l.shares > 0);

    return {
      sub_fund_id: subFundId,
      bids: bidLevels,
      asks: askLevels,
      best_bid_etb: bidLevels[0]?.price_etb ?? null,
      best_ask_etb: askLevels[0]?.price_etb ?? null,
      spread_etb:
        bidLevels[0] && askLevels[0]
          ? roundCash(askLevels[0].price_etb - bidLevels[0].price_etb)
          : null,
    };
  }

  /** Headline numbers for the marketplace hero panel. */
  async getHighlights() {
    const [[totals]]: any = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM sub_funds WHERE sub_fund_status <> 'DISSOLVED') AS listed_sub_funds,
         (SELECT COALESCE(SUM(independent_appraised_value_etb), 0) FROM assets_master
           WHERE lifecycle_status = 'TOKENIZED') AS total_value_locked_etb,
         (SELECT COALESCE(SUM(gross_value_etb), 0) FROM trade_fills
           WHERE executed_at >= NOW() - INTERVAL 24 HOUR) AS volume_24h_etb,
         (SELECT COUNT(*) FROM trade_fills
           WHERE executed_at >= NOW() - INTERVAL 24 HOUR) AS trades_24h`,
    );

    return {
      listed_sub_funds: Number(totals.listed_sub_funds),
      total_value_locked_etb: toCash(totals.total_value_locked_etb),
      volume_24h_etb: toCash(totals.volume_24h_etb),
      trades_24h: Number(totals.trades_24h),
    };
  }

  private decorate(row: any) {
    const mark = toCash(row.current_net_asset_value_nav_etb);
    const previous = row.price_24h_ago_etb ? toCash(row.price_24h_ago_etb) : null;

    return {
      sub_fund_id: row.sub_fund_id,
      asset_id: row.asset_id,
      asset_name: row.asset_name,
      category: row.category,
      location: row.physical_location_description,
      custodian_bank_name: row.custodian_bank_name,
      last_appraisal_date: row.last_appraisal_date ?? null,
      sub_fund_status: row.sub_fund_status,
      total_issued_shares: toShares(row.total_issued_shares),
      nominal_price_per_share_etb: toCash(row.nominal_price_per_share_etb),
      price_per_share_etb: mark,
      appraised_value_etb: toCash(row.independent_appraised_value_etb),
      market_capitalisation_etb: roundCash(
        toShares(row.total_issued_shares) * mark,
      ),
      offering_shares_remaining: toShares(row.offering_shares_remaining),
      best_bid_etb: row.best_bid_etb ? toCash(row.best_bid_etb) : null,
      best_ask_etb: row.best_ask_etb ? toCash(row.best_ask_etb) : null,
      volume_24h_etb: toCash(row.volume_24h_etb),
      // Null rather than zero when there is no comparison point, so the UI can
      // show "new" instead of a misleading flat line.
      price_change_24h_percentage:
        previous && previous > 0
          ? Number((((mark - previous) / previous) * 100).toFixed(2))
          : null,
    };
  }
}

export const marketService = new MarketService();
