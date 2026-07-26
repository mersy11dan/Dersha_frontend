import pool from "../database/database.config";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { toCash, toShares, roundCash } from "../utils/money";

export class PortfolioService {
  async getHoldings(userId: string) {
    const securities = new SecuritiesRepository(pool);
    const rows = await securities.listHoldings(userId);

    // Vesting locks are reported alongside the balance so the UI can explain
    // why part of a holding cannot be sold.
    const [locks]: any = await pool.execute(
      `SELECT sub_fund_id, SUM(shares_locked) AS shares, MIN(unlock_at) AS unlock_at
       FROM share_vesting_locks
       WHERE user_id = ? AND released = 0
       GROUP BY sub_fund_id`,
      [userId],
    );

    const lockBySubFund = new Map(
      locks.map((lock: any) => [
        lock.sub_fund_id,
        { shares: toShares(lock.shares), unlock_at: lock.unlock_at },
      ]),
    );

    return rows.map((row: any) => {
      const shares = toShares(row.shares_owned);
      const locked = toShares(row.locked_shares);
      const mark = toCash(row.current_net_asset_value_nav_etb);
      const cost = toCash(row.nominal_price_per_share_etb);
      const vesting: any = lockBySubFund.get(row.sub_fund_id) ?? null;

      return {
        sub_fund_id: row.sub_fund_id,
        asset_id: row.asset_id,
        asset_name: row.asset_name,
        category: row.category,
        location: row.physical_location_description,
        sub_fund_status: row.sub_fund_status,
        shares_owned: shares,
        locked_shares: locked,
        tradable_shares: toShares(shares - locked),
        price_per_share_etb: mark,
        nominal_price_per_share_etb: cost,
        market_value_etb: roundCash(shares * mark),
        unrealised_gain_etb: roundCash(shares * (mark - cost)),
        unrealised_gain_percentage:
          cost > 0 ? Number((((mark - cost) / cost) * 100).toFixed(2)) : 0,
        ownership_percentage: Number(
          ((shares / toShares(row.total_issued_shares)) * 100).toFixed(4),
        ),
        vesting_locked_shares: vesting?.shares ?? 0,
        vesting_unlock_at: vesting?.unlock_at ?? null,
      };
    });
  }

  async getSummary(userId: string) {
    const holdings = await this.getHoldings(userId);

    const [[wallet]]: any = await pool.execute(
      `SELECT available_balance_etb, escrowed_balance_etb FROM wallets WHERE user_id = ?`,
      [userId],
    );

    const [[baskets]]: any = await pool.execute(
      `SELECT COALESCE(SUM(bb.basket_shares_owned / NULLIF(cb.total_basket_shares, 0)
                          * cb.dynamic_basket_nav_etb), 0) AS basket_value_etb,
              COUNT(*) AS basket_count
       FROM custom_basket_balances bb
       JOIN custom_baskets cb ON cb.basket_id = bb.basket_id
       WHERE bb.user_id = ? AND bb.basket_shares_owned > 0`,
      [userId],
    );

    const [[income]]: any = await pool.execute(
      `SELECT COALESCE(SUM(net_payout_etb), 0) AS lifetime_income_etb
       FROM sub_fund_yield_investor_payouts WHERE user_id = ?`,
      [userId],
    );

    const securitiesValue = holdings.reduce(
      (sum: number, holding: any) => roundCash(sum + holding.market_value_etb),
      0,
    );
    const basketValue = toCash(baskets.basket_value_etb);
    const cash = toCash(wallet?.available_balance_etb);
    const escrowed = toCash(wallet?.escrowed_balance_etb);
    const unrealised = holdings.reduce(
      (sum: number, holding: any) => roundCash(sum + holding.unrealised_gain_etb),
      0,
    );

    return {
      cash_available_etb: cash,
      cash_escrowed_etb: escrowed,
      securities_value_etb: securitiesValue,
      basket_value_etb: basketValue,
      total_portfolio_value_etb: roundCash(
        cash + escrowed + securitiesValue + basketValue,
      ),
      unrealised_gain_etb: unrealised,
      lifetime_income_etb: toCash(income.lifetime_income_etb),
      holding_count: holdings.length,
      basket_count: Number(baskets.basket_count),
    };
  }

  /** Unified activity feed across cash movements and share trades. */
  async getActivity(userId: string, limit = 20) {
    const [rows]: any = await pool.query(
      `(SELECT 'CASH' AS stream, transaction_id AS id, type AS label, net_amount_etb AS amount_etb,
               status, recorded_at AS occurred_at, NULL AS shares, NULL AS asset_name
        FROM financial_transactions_ledger WHERE user_id = ?)
       UNION ALL
       (SELECT 'TRADE' AS stream, f.fill_id AS id,
               CASE WHEN f.buyer_user_id = ? THEN 'BUY' ELSE 'SELL' END AS label,
               f.gross_value_etb AS amount_etb, f.execution_type AS status,
               f.executed_at AS occurred_at, f.shares_filled AS shares, a.asset_name
        FROM trade_fills f
        JOIN sub_funds sf ON sf.sub_fund_id = f.sub_fund_id
        JOIN assets_master a ON a.asset_id = sf.asset_id
        WHERE f.buyer_user_id = ? OR f.seller_user_id = ?)
       ORDER BY occurred_at DESC
       LIMIT ?`,
      [userId, userId, userId, userId, limit],
    );

    return rows.map((row: any) => ({
      stream: row.stream,
      id: row.id,
      label: row.label,
      amount_etb: toCash(row.amount_etb),
      shares: row.shares ? toShares(row.shares) : null,
      asset_name: row.asset_name,
      status: row.status,
      occurred_at: row.occurred_at,
    }));
  }
}

export const portfolioService = new PortfolioService();
