import { randomUUID } from "node:crypto";
import { PoolConnection } from "mysql2/promise";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit } from "../repository/AuditRepository";
import { YieldDistribution } from "../schemas/yield.schema";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { SYSTEM_ACCOUNTS } from "../constants/systemAccounts";
import { cashLiteral, roundCash, shareLiteral, toCash, toShares } from "../utils/money";
import { RequestContext } from "../utils/requestContext";
import { realtimeHub } from "../realtime/hub";

interface Claim {
  userId: string;
  shares: number;
  source: "DIRECT_HOLDING" | "BASKET_CONSTITUENT";
  basketId: string | null;
}

/**
 * Flow 5 Step 1. Routes collected revenue to whoever held the sub-fund's shares
 * at the moment the distribution ran.
 */
export class YieldService {
  async distribute(
    subFundId: string,
    declaredBy: string,
    payload: YieldDistribution,
    context: Partial<RequestContext> = {},
  ) {
    const existing = await this.findByIdempotencyKey(payload.idempotency_key);
    if (existing) return this.describeDistribution(existing.distribution_id);

    const distributionId = randomUUID();
    const taxRate = env.economics.withholdingTaxRate;

    await withTransaction(async (connection) => {
      const wallets = new WalletRepository(connection);

      const [subFundRows]: any = await connection.execute(
        `SELECT sf.sub_fund_id, sf.total_issued_shares, a.asset_name
         FROM sub_funds sf
         JOIN assets_master a ON a.asset_id = sf.asset_id
         WHERE sf.sub_fund_id = ? FOR UPDATE`,
        [subFundId],
      );

      if (subFundRows.length === 0) {
        throw ApiError.notFound("SUB_FUND_NOT_FOUND", "No such sub-fund.");
      }

      const distributable = roundCash(
        payload.gross_revenue_collected_etb -
          payload.opex_deductions_etb -
          payload.platform_fees_retained_etb,
      );

      const claims = await this.collectClaims(connection, subFundId);
      const totalShares = claims.reduce((sum, claim) => sum + claim.shares, 0);

      if (totalShares <= 0) {
        throw ApiError.conflict(
          "NO_SHAREHOLDERS",
          "This sub-fund has no shareholders to distribute to.",
        );
      }

      // The declaring manager funds the payout, so cash entering investor
      // wallets is always matched by cash leaving somewhere else. Without this
      // the nightly reconciliation would see the platform mint money.
      await wallets.debitAvailable(connection, declaredBy, distributable);
      if (payload.platform_fees_retained_etb > 0) {
        await wallets.debitAvailable(
          connection,
          declaredBy,
          payload.platform_fees_retained_etb,
        );
        await wallets.creditAvailable(
          connection,
          SYSTEM_ACCOUNTS.PLATFORM_FEE_ACCOUNT,
          payload.platform_fees_retained_etb,
        );
      }

      // The header is written before the payouts that reference it; the totals
      // are only known once every slice has been computed, so they are filled
      // in at the end of the same transaction.
      await connection.execute(
        `INSERT INTO sub_fund_yield_distributions
          (distribution_id, sub_fund_id, yield_category, gross_revenue_collected_etb,
           opex_deductions_etb, platform_fees_retained_etb, total_tax_withheld_etb,
           net_amount_disbursed_etb, reporting_period_start, reporting_period_end,
           idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?, 0.0000, 0.0000, ?, ?, ?)`,
        [
          distributionId,
          subFundId,
          payload.yield_category,
          cashLiteral(payload.gross_revenue_collected_etb),
          cashLiteral(payload.opex_deductions_etb),
          cashLiteral(payload.platform_fees_retained_etb),
          payload.reporting_period_start,
          payload.reporting_period_end,
          payload.idempotency_key,
        ],
      );

      const allocations = this.allocate(claims, totalShares, distributable);

      let totalTax = 0;
      let totalNet = 0;

      for (const allocation of allocations) {
        const tax = roundCash(allocation.gross * taxRate);
        const net = roundCash(allocation.gross - tax);

        await wallets.creditAvailable(connection, allocation.claim.userId, net);
        totalTax = roundCash(totalTax + tax);
        totalNet = roundCash(totalNet + net);

        await connection.execute(
          `INSERT INTO sub_fund_yield_investor_payouts
            (distribution_id, user_id, sub_fund_id, basket_id, payout_source,
             shares_held_at_record, ownership_percentage,
             gross_payout_etb, tax_withheld_etb, net_payout_etb)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            distributionId,
            allocation.claim.userId,
            subFundId,
            allocation.claim.basketId,
            allocation.claim.source,
            shareLiteral(allocation.claim.shares),
            (allocation.claim.shares / totalShares) * 100,
            cashLiteral(allocation.gross),
            cashLiteral(tax),
            cashLiteral(net),
          ],
        );

        await connection.execute(
          `INSERT INTO tax_withholding_ledger
            (user_id, sub_fund_id, distribution_id, tax_category, gross_amount_etb,
             tax_rate_applied, tax_withheld_etb, reporting_period_start, reporting_period_end)
           VALUES (?, ?, ?, 'DIVIDEND_WITHHOLDING', ?, ?, ?, ?, ?)`,
          [
            allocation.claim.userId,
            subFundId,
            distributionId,
            cashLiteral(allocation.gross),
            taxRate.toFixed(4),
            cashLiteral(tax),
            payload.reporting_period_start,
            payload.reporting_period_end,
          ],
        );

        await wallets.recordTransaction(connection, {
          transactionId: randomUUID(),
          userId: allocation.claim.userId,
          type: "DIVIDEND_PAYOUT",
          grossAmountEtb: allocation.gross,
          feeDeductedEtb: tax,
          netAmountEtb: net,
          status: "SETTLED",
          idempotencyKey: `YIELD-${distributionId}-${allocation.claim.userId}-${allocation.claim.basketId ?? "DIRECT"}`,
          settledAt: new Date(),
        });
      }

      // Withheld tax is held for the revenue authority rather than kept.
      if (totalTax > 0) {
        await wallets.creditAvailable(
          connection,
          SYSTEM_ACCOUNTS.GOVERNMENT_TAX_LEDGER,
          totalTax,
        );
      }

      await connection.execute(
        `UPDATE sub_fund_yield_distributions
         SET total_tax_withheld_etb = ?, net_amount_disbursed_etb = ?
         WHERE distribution_id = ?`,
        [cashLiteral(totalTax), cashLiteral(totalNet), distributionId],
      );

      await recordAudit(connection, {
        userId: declaredBy,
        category: "YIELD",
        eventType: "YIELD_DISTRIBUTED",
        referenceId: distributionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          sub_fund_id: subFundId,
          asset_name: subFundRows[0].asset_name,
          distributable_etb: distributable,
          tax_rate: taxRate,
          total_tax_withheld_etb: totalTax,
          net_disbursed_etb: totalNet,
          recipient_count: allocations.length,
        },
      });
    });

    realtimeHub.publish(`subfund:${subFundId}`, "yield_distributed", {
      sub_fund_id: subFundId,
      distribution_id: distributionId,
    });

    return this.describeDistribution(distributionId);
  }

  /**
   * Everyone with an economic claim on the sub-fund.
   *
   * Shares parked in basket custody belong to the basket's holders, not to the
   * custody account, so those are decomposed into per-holder claims. A basket
   * investor is entitled to yield they never see directly.
   */
  private async collectClaims(
    connection: PoolConnection,
    subFundId: string,
  ): Promise<Claim[]> {
    const [direct]: any = await connection.execute(
      `SELECT user_id, shares_owned FROM sub_fund_balances
       WHERE sub_fund_id = ? AND shares_owned > 0 AND user_id <> ?`,
      [subFundId, SYSTEM_ACCOUNTS.BASKET_CUSTODY_POOL],
    );

    const claims: Claim[] = direct.map((row: any) => ({
      userId: row.user_id,
      shares: toShares(row.shares_owned),
      source: "DIRECT_HOLDING" as const,
      basketId: null,
    }));

    const [wrapped]: any = await connection.execute(
      `SELECT c.basket_id, c.shares_allocated, bal.user_id, bal.basket_shares_owned,
              b.total_basket_shares
       FROM custom_basket_constituents c
       JOIN custom_baskets b ON b.basket_id = c.basket_id
       JOIN custom_basket_balances bal ON bal.basket_id = c.basket_id
       WHERE c.sub_fund_id = ?
         AND b.lifecycle_status <> 'DISSOLVED'
         AND bal.basket_shares_owned > 0`,
      [subFundId],
    );

    for (const row of wrapped) {
      const supply = toShares(row.total_basket_shares);
      if (supply <= 0) continue;

      const holderFraction = toShares(row.basket_shares_owned) / supply;
      claims.push({
        userId: row.user_id,
        shares: toShares(toShares(row.shares_allocated) * holderFraction),
        source: "BASKET_CONSTITUENT",
        basketId: row.basket_id,
      });
    }

    return claims.filter((claim) => claim.shares > 0);
  }

  /**
   * Splits the pot pro-rata to the nearest cent, then gives the rounding
   * remainder to the largest holder. Every birr paid in must be paid out, or
   * the reconciliation job would flag the residue as drift every single night.
   */
  private allocate(claims: Claim[], totalShares: number, distributable: number) {
    const allocations = claims.map((claim) => ({
      claim,
      gross: roundCash((claim.shares / totalShares) * distributable),
    }));

    const assigned = allocations.reduce(
      (sum, allocation) => roundCash(sum + allocation.gross),
      0,
    );
    const dust = roundCash(distributable - assigned);

    if (dust !== 0 && allocations.length > 0) {
      const largest = allocations.reduce((best, current) =>
        current.gross > best.gross ? current : best,
      );
      largest.gross = roundCash(largest.gross + dust);
    }

    return allocations.filter((allocation) => allocation.gross > 0);
  }

  async describeDistribution(distributionId: string) {
    const [rows]: any = await pool.execute(
      `SELECT d.*, a.asset_name
       FROM sub_fund_yield_distributions d
       JOIN sub_funds sf ON sf.sub_fund_id = d.sub_fund_id
       JOIN assets_master a ON a.asset_id = sf.asset_id
       WHERE d.distribution_id = ? LIMIT 1`,
      [distributionId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("DISTRIBUTION_NOT_FOUND", "No such distribution.");
    }

    const [payouts]: any = await pool.execute(
      `SELECT p.user_id, p.basket_id, p.payout_source, p.shares_held_at_record,
              p.ownership_percentage, p.gross_payout_etb, p.tax_withheld_etb,
              p.net_payout_etb, u.full_name_raw AS investor_name
       FROM sub_fund_yield_investor_payouts p
       JOIN users u ON u.user_id = p.user_id
       WHERE p.distribution_id = ?
       ORDER BY p.gross_payout_etb DESC`,
      [distributionId],
    );

    return {
      distribution_id: distributionId,
      sub_fund_id: rows[0].sub_fund_id,
      asset_name: rows[0].asset_name,
      yield_category: rows[0].yield_category,
      gross_revenue_collected_etb: toCash(rows[0].gross_revenue_collected_etb),
      opex_deductions_etb: toCash(rows[0].opex_deductions_etb),
      platform_fees_retained_etb: toCash(rows[0].platform_fees_retained_etb),
      total_tax_withheld_etb: toCash(rows[0].total_tax_withheld_etb),
      net_amount_disbursed_etb: toCash(rows[0].net_amount_disbursed_etb),
      withholding_tax_rate: env.economics.withholdingTaxRate,
      reporting_period_start: rows[0].reporting_period_start,
      reporting_period_end: rows[0].reporting_period_end,
      processed_at: rows[0].processed_at,
      recipient_count: payouts.length,
      payouts: payouts.map((payout: any) => ({
        user_id: payout.user_id,
        investor_name: payout.investor_name,
        basket_id: payout.basket_id,
        payout_source: payout.payout_source,
        shares_held_at_record: toShares(payout.shares_held_at_record),
        ownership_percentage: Number(payout.ownership_percentage),
        gross_payout_etb: toCash(payout.gross_payout_etb),
        tax_withheld_etb: toCash(payout.tax_withheld_etb),
        net_payout_etb: toCash(payout.net_payout_etb),
      })),
    };
  }

  async listDistributions(subFundId: string) {
    const [rows]: any = await pool.execute(
      `SELECT distribution_id, yield_category, gross_revenue_collected_etb,
              total_tax_withheld_etb, net_amount_disbursed_etb,
              reporting_period_start, reporting_period_end, processed_at
       FROM sub_fund_yield_distributions
       WHERE sub_fund_id = ?
       ORDER BY processed_at DESC
       LIMIT 50`,
      [subFundId],
    );

    return rows.map((row: any) => ({
      ...row,
      gross_revenue_collected_etb: toCash(row.gross_revenue_collected_etb),
      total_tax_withheld_etb: toCash(row.total_tax_withheld_etb),
      net_amount_disbursed_etb: toCash(row.net_amount_disbursed_etb),
    }));
  }

  /** An investor's income statement, including the tax withheld on their behalf. */
  async investorIncome(userId: string) {
    const [rows]: any = await pool.execute(
      `SELECT p.payout_id, p.distribution_id, p.sub_fund_id, p.basket_id,
              p.payout_source, p.shares_held_at_record, p.gross_payout_etb,
              p.tax_withheld_etb, p.net_payout_etb, p.created_at,
              a.asset_name, cb.basket_name
       FROM sub_fund_yield_investor_payouts p
       JOIN sub_funds sf ON sf.sub_fund_id = p.sub_fund_id
       JOIN assets_master a ON a.asset_id = sf.asset_id
       LEFT JOIN custom_baskets cb ON cb.basket_id = p.basket_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId],
    );

    const payouts = rows.map((row: any) => ({
      payout_id: row.payout_id,
      distribution_id: row.distribution_id,
      sub_fund_id: row.sub_fund_id,
      asset_name: row.asset_name,
      basket_id: row.basket_id,
      basket_name: row.basket_name,
      payout_source: row.payout_source,
      shares_held_at_record: toShares(row.shares_held_at_record),
      gross_payout_etb: toCash(row.gross_payout_etb),
      tax_withheld_etb: toCash(row.tax_withheld_etb),
      net_payout_etb: toCash(row.net_payout_etb),
      received_at: row.created_at,
    }));

    return {
      lifetime_gross_etb: payouts.reduce(
        (sum: number, p: any) => roundCash(sum + p.gross_payout_etb),
        0,
      ),
      lifetime_tax_withheld_etb: payouts.reduce(
        (sum: number, p: any) => roundCash(sum + p.tax_withheld_etb),
        0,
      ),
      lifetime_net_etb: payouts.reduce(
        (sum: number, p: any) => roundCash(sum + p.net_payout_etb),
        0,
      ),
      withholding_tax_rate: env.economics.withholdingTaxRate,
      payouts,
    };
  }

  private async findByIdempotencyKey(key: string) {
    const [rows]: any = await pool.execute(
      `SELECT distribution_id FROM sub_fund_yield_distributions
       WHERE idempotency_key = ? LIMIT 1`,
      [key],
    );
    return rows[0] ?? null;
  }
}

export const yieldService = new YieldService();
