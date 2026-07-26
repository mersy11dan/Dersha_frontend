import { randomUUID } from "node:crypto";
import { PoolConnection } from "mysql2/promise";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { recordAudit, recordAuditDetached } from "../repository/AuditRepository";
import { PLATFORM_CONFIG_KEYS, SYSTEM_ACCOUNTS } from "../constants/systemAccounts";
import { cashLiteral, roundCash, roundShares, toCash, toShares } from "../utils/money";
import { realtimeHub } from "../realtime/hub";

export type ExceptionType =
  | "MISSING_IN_LEDGER"
  | "MISSING_AT_BANK"
  | "AMOUNT_MISMATCH"
  | "DUPLICATE_SETTLEMENT"
  | "ESCROW_DRIFT"
  | "SHARE_LEDGER_DRIFT"
  | "SUPPLY_MISMATCH"
  | "BASKET_CUSTODY_DRIFT"
  | "NEGATIVE_BALANCE"
  | "TAX_LEDGER_DRIFT";

interface Finding {
  checkName: string;
  subjectId: string;
  type: ExceptionType;
  severity: "WARNING" | "CRITICAL";
  expected: number | null;
  actual: number | null;
  notes: string;
  /** Set when the engine repaired the drift itself. */
  healed?: boolean;
}

export interface ReconciliationReport {
  run_id: string;
  business_date: string;
  status: "BALANCED" | "VARIANCE_DETECTED" | "FAILED";
  checks_run: number;
  matched_count: number;
  unmatched_count: number;
  self_healed_count: number;
  ledger_total_etb: number;
  bank_total_etb: number;
  variance_etb: number;
  trading_halted: boolean;
  findings: Finding[];
}

// Sub-cent and sub-microshare differences are representation noise, not drift.
const CASH_TOLERANCE = 0.005;
const SHARE_TOLERANCE = 0.0000005;

/**
 * Flow 5 Step 2. The nightly proof that the platform's books still add up.
 *
 * Each check restates one invariant that the write paths are supposed to
 * maintain. Two classes of drift are repairable from data the system already
 * holds and are patched in place; everything else is escalated, because a
 * silent "fix" to an unexplained imbalance would destroy the evidence needed to
 * find the bug that caused it.
 */
export class ReconciliationService {
  async run(
    options: { businessDate?: string; triggeredBy?: string | null } = {},
  ): Promise<ReconciliationReport> {
    const runId = randomUUID();
    const businessDate =
      options.businessDate ?? new Date().toISOString().slice(0, 10);

    await pool.execute(
      `INSERT INTO reconciliation_runs (run_id, business_date, status)
       VALUES (?, ?, 'RUNNING')`,
      [runId, businessDate],
    );

    try {
      const findings: Finding[] = [];

      findings.push(...(await this.checkNegativeBalances()));
      findings.push(...(await this.checkEscrowIntegrity()));
      findings.push(...(await this.checkShareLedger()));
      findings.push(...(await this.checkSubFundSupply()));
      findings.push(...(await this.checkBasketCustody()));
      findings.push(...(await this.checkTaxLedger()));

      const cash = await this.cashPosition();
      const healed = findings.filter((finding) => finding.healed);
      const unresolved = findings.filter((finding) => !finding.healed);
      const critical = unresolved.filter(
        (finding) => finding.severity === "CRITICAL",
      );

      for (const finding of findings) {
        await pool.execute(
          `INSERT INTO reconciliation_exceptions
            (run_id, check_name, subject_id, exception_type, severity,
             expected_amount_etb, actual_amount_etb, resolution_status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            runId,
            finding.checkName,
            finding.subjectId,
            finding.type,
            finding.severity,
            finding.expected === null ? null : cashLiteral(finding.expected),
            finding.actual === null ? null : cashLiteral(finding.actual),
            finding.healed
              ? "SELF_HEALED"
              : finding.severity === "CRITICAL"
                ? "ESCALATED"
                : "OPEN",
            finding.notes,
          ],
        );
      }

      const status = unresolved.length === 0 ? "BALANCED" : "VARIANCE_DETECTED";

      await pool.execute(
        `UPDATE reconciliation_runs
         SET status = ?, ledger_total_etb = ?, bank_total_etb = ?, variance_etb = ?,
             matched_count = ?, unmatched_count = ?, self_healed_count = ?,
             completed_at = CURRENT_TIMESTAMP
         WHERE run_id = ?`,
        [
          status,
          cashLiteral(cash.ledgerTotal),
          cashLiteral(cash.bankTotal),
          cashLiteral(cash.variance),
          cash.matchedCount,
          unresolved.length,
          healed.length,
          runId,
        ],
      );

      if (critical.length > 0) {
        await this.raiseBreachAlarm(runId, critical);
      }

      await recordAuditDetached({
        userId: options.triggeredBy ?? null,
        category: "RECONCILIATION",
        eventType: "RECONCILIATION_COMPLETED",
        severity: critical.length > 0 ? "CRITICAL" : "INFO",
        referenceId: runId,
        payload: {
          status,
          self_healed: healed.length,
          unresolved: unresolved.length,
          critical: critical.length,
        },
      });

      const halt = await this.getHaltState();

      return {
        run_id: runId,
        business_date: businessDate,
        status,
        checks_run: 6,
        matched_count: cash.matchedCount,
        unmatched_count: unresolved.length,
        self_healed_count: healed.length,
        ledger_total_etb: cash.ledgerTotal,
        bank_total_etb: cash.bankTotal,
        variance_etb: cash.variance,
        trading_halted: halt.halted,
        findings,
      };
    } catch (error) {
      await pool.execute(
        `UPDATE reconciliation_runs
         SET status = 'FAILED', completed_at = CURRENT_TIMESTAMP
         WHERE run_id = ?`,
        [runId],
      );
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Checks
  // -------------------------------------------------------------------------

  /** Nothing may ever go below zero; a negative balance means a debit escaped its guard. */
  private async checkNegativeBalances(): Promise<Finding[]> {
    const findings: Finding[] = [];

    const [wallets]: any = await pool.query(
      `SELECT user_id, available_balance_etb, escrowed_balance_etb
       FROM wallets
       WHERE available_balance_etb < 0 OR escrowed_balance_etb < 0`,
    );

    for (const wallet of wallets) {
      findings.push({
        checkName: "NEGATIVE_WALLET_BALANCE",
        subjectId: wallet.user_id,
        type: "NEGATIVE_BALANCE",
        severity: "CRITICAL",
        expected: 0,
        actual: Math.min(
          toCash(wallet.available_balance_etb),
          toCash(wallet.escrowed_balance_etb),
        ),
        notes: `Wallet holds a negative balance (available ${toCash(wallet.available_balance_etb)}, escrowed ${toCash(wallet.escrowed_balance_etb)}).`,
      });
    }

    const [shares]: any = await pool.query(
      `SELECT user_id, sub_fund_id, shares_owned, locked_shares
       FROM sub_fund_balances
       WHERE shares_owned < 0 OR locked_shares < 0 OR locked_shares > shares_owned`,
    );

    for (const balance of shares) {
      findings.push({
        checkName: "IMPOSSIBLE_SHARE_BALANCE",
        subjectId: `${balance.user_id}:${balance.sub_fund_id}`,
        type: "NEGATIVE_BALANCE",
        severity: "CRITICAL",
        expected: toShares(balance.shares_owned),
        actual: toShares(balance.locked_shares),
        notes: `Share balance is negative or over-locked (owned ${toShares(balance.shares_owned)}, locked ${toShares(balance.locked_shares)}).`,
      });
    }

    return findings;
  }

  /**
   * The escrowed column must equal the sum of the open escrow records behind it.
   *
   * Self-healing: the escrow records are the itemised source of truth and the
   * column is a cached total, so recomputing the total from the records is a
   * restatement rather than a guess.
   */
  private async checkEscrowIntegrity(): Promise<Finding[]> {
    const [rows]: any = await pool.query(
      `SELECT w.wallet_id, w.user_id, w.escrowed_balance_etb,
              COALESCE(e.open_total, 0) AS open_total
       FROM wallets w
       LEFT JOIN (
         SELECT wallet_id, SUM(amount_etb) AS open_total
         FROM wallet_escrow_records
         WHERE released_or_spent = 0
         GROUP BY wallet_id
       ) e ON e.wallet_id = w.wallet_id
       WHERE ABS(w.escrowed_balance_etb - COALESCE(e.open_total, 0)) > 0.005`,
    );

    const findings: Finding[] = [];

    for (const row of rows) {
      const expected = toCash(row.open_total);
      const actual = toCash(row.escrowed_balance_etb);
      const delta = roundCash(expected - actual);

      // Correcting escrow must not create cash: the difference moves between
      // the escrowed and available columns of the same wallet.
      const healed = await withTransaction(async (connection) => {
        const [[current]]: any = await connection.execute(
          `SELECT available_balance_etb, escrowed_balance_etb
           FROM wallets WHERE wallet_id = ? FOR UPDATE`,
          [row.wallet_id],
        );

        const availableAfter = roundCash(toCash(current.available_balance_etb) - delta);
        if (availableAfter < 0) return false;

        await connection.execute(
          `UPDATE wallets
           SET escrowed_balance_etb = ?, available_balance_etb = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE wallet_id = ?`,
          [cashLiteral(expected), cashLiteral(availableAfter), row.wallet_id],
        );

        await recordAudit(connection, {
          userId: row.user_id,
          category: "RECONCILIATION",
          eventType: "ESCROW_SELF_HEALED",
          severity: "WARNING",
          referenceId: row.wallet_id,
          payload: {
            escrowed_before_etb: actual,
            escrowed_after_etb: expected,
            adjustment_etb: delta,
          },
        });

        return true;
      });

      findings.push({
        checkName: "ESCROW_MATCHES_OPEN_RECORDS",
        subjectId: row.user_id,
        type: "ESCROW_DRIFT",
        severity: healed ? "WARNING" : "CRITICAL",
        expected,
        actual,
        notes: healed
          ? `Escrow column restated from the open escrow records (${actual} to ${expected} ETB).`
          : `Escrow column disagrees with the open escrow records and could not be restated without pushing the available balance negative.`,
        healed,
      });
    }

    return findings;
  }

  /** Balances must equal the replay of the immutable securities ledger. */
  private async checkShareLedger(): Promise<Finding[]> {
    const [rows]: any = await pool.query(
      `SELECT b.user_id, b.sub_fund_id, b.shares_owned,
              COALESCE(l.net_shares, 0) AS net_shares
       FROM sub_fund_balances b
       LEFT JOIN (
         SELECT user_id, sub_fund_id, SUM(delta) AS net_shares FROM (
           SELECT receiver_user_id AS user_id, sub_fund_id, shares_transferred AS delta
             FROM sub_fund_securities_ledger WHERE receiver_user_id IS NOT NULL
           UNION ALL
           SELECT sender_user_id AS user_id, sub_fund_id, -shares_transferred AS delta
             FROM sub_fund_securities_ledger WHERE sender_user_id IS NOT NULL
         ) movements
         GROUP BY user_id, sub_fund_id
       ) l ON l.user_id = b.user_id AND l.sub_fund_id = b.sub_fund_id
       WHERE ABS(b.shares_owned - COALESCE(l.net_shares, 0)) > 0.0000005`,
    );

    return rows.map((row: any) => ({
      checkName: "BALANCE_MATCHES_SECURITIES_LEDGER",
      subjectId: `${row.user_id}:${row.sub_fund_id}`,
      type: "SHARE_LEDGER_DRIFT" as const,
      severity: "CRITICAL" as const,
      expected: toShares(row.net_shares),
      actual: toShares(row.shares_owned),
      notes: `Share balance ${toShares(row.shares_owned)} does not match the ledger replay of ${toShares(row.net_shares)}.`,
    }));
  }

  /** Issued supply must equal the sum of everyone's holdings. */
  private async checkSubFundSupply(): Promise<Finding[]> {
    const [rows]: any = await pool.query(
      `SELECT sf.sub_fund_id, sf.total_issued_shares,
              COALESCE(SUM(b.shares_owned), 0) AS held_shares
       FROM sub_funds sf
       LEFT JOIN sub_fund_balances b ON b.sub_fund_id = sf.sub_fund_id
       WHERE sf.sub_fund_status <> 'DISSOLVED'
       GROUP BY sf.sub_fund_id, sf.total_issued_shares
       HAVING ABS(sf.total_issued_shares - COALESCE(SUM(b.shares_owned), 0)) > 0.0000005`,
    );

    return rows.map((row: any) => ({
      checkName: "SUPPLY_MATCHES_HOLDINGS",
      subjectId: row.sub_fund_id,
      type: "SUPPLY_MISMATCH" as const,
      severity: "CRITICAL" as const,
      expected: toShares(row.total_issued_shares),
      actual: toShares(row.held_shares),
      notes: `Issued supply ${toShares(row.total_issued_shares)} does not equal the ${toShares(row.held_shares)} shares held across all accounts.`,
    }));
  }

  /** The custody pool must hold exactly what the live baskets claim it holds. */
  private async checkBasketCustody(): Promise<Finding[]> {
    const [rows]: any = await pool.execute(
      `SELECT c.sub_fund_id,
              SUM(c.shares_allocated) AS allocated,
              COALESCE(MAX(b.shares_owned), 0) AS custodied
       FROM custom_basket_constituents c
       JOIN custom_baskets cb ON cb.basket_id = c.basket_id
       LEFT JOIN sub_fund_balances b
         ON b.sub_fund_id = c.sub_fund_id AND b.user_id = ?
       WHERE cb.lifecycle_status <> 'DISSOLVED'
       GROUP BY c.sub_fund_id
       HAVING ABS(SUM(c.shares_allocated) - COALESCE(MAX(b.shares_owned), 0)) > 0.0000005`,
      [SYSTEM_ACCOUNTS.BASKET_CUSTODY_POOL],
    );

    return rows.map((row: any) => ({
      checkName: "CUSTODY_BACKS_BASKETS",
      subjectId: row.sub_fund_id,
      type: "BASKET_CUSTODY_DRIFT" as const,
      severity: "CRITICAL" as const,
      expected: toShares(row.allocated),
      actual: toShares(row.custodied),
      notes: `Baskets claim ${toShares(row.allocated)} shares in custody but the pool holds ${toShares(row.custodied)}.`,
    }));
  }

  /** Withheld tax must still be sitting in the government ledger wallet. */
  private async checkTaxLedger(): Promise<Finding[]> {
    const [[withheld]]: any = await pool.execute(
      `SELECT COALESCE(SUM(tax_withheld_etb), 0) AS total
       FROM tax_withholding_ledger WHERE remitted_to_authority = 0`,
    );
    const [[wallet]]: any = await pool.execute(
      "SELECT available_balance_etb FROM wallets WHERE user_id = ?",
      [SYSTEM_ACCOUNTS.GOVERNMENT_TAX_LEDGER],
    );

    const expected = toCash(withheld.total);
    const actual = toCash(wallet?.available_balance_etb);

    if (Math.abs(expected - actual) <= CASH_TOLERANCE) return [];

    return [
      {
        checkName: "TAX_HELD_MATCHES_LEDGER",
        subjectId: SYSTEM_ACCOUNTS.GOVERNMENT_TAX_LEDGER,
        type: "TAX_LEDGER_DRIFT",
        severity: "CRITICAL",
        expected,
        actual,
        notes: `Unremitted withholding tax totals ${expected} ETB but the tax wallet holds ${actual} ETB.`,
      },
    ];
  }

  /**
   * Compares the platform's cash position against the custodian statement.
   * In mock mode the statement is derived from settled transactions, so this
   * reports the position rather than proving it against a third party.
   */
  private async cashPosition() {
    const [[wallets]]: any = await pool.query(
      `SELECT COALESCE(SUM(available_balance_etb + escrowed_balance_etb), 0) AS total
       FROM wallets`,
    );
    const [[settled]]: any = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'DEPOSIT'    THEN net_amount_etb ELSE 0 END), 0) AS deposits,
         COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' THEN gross_amount_etb ELSE 0 END), 0) AS withdrawals,
         COUNT(*) AS matched
       FROM financial_transactions_ledger
       WHERE status = 'SETTLED' AND type IN ('DEPOSIT','WITHDRAWAL')`,
    );

    const ledgerTotal = toCash(wallets.total);
    const bankTotal = roundCash(toCash(settled.deposits) - toCash(settled.withdrawals));

    return {
      ledgerTotal,
      bankTotal,
      variance: roundCash(ledgerTotal - bankTotal),
      matchedCount: Number(settled.matched),
    };
  }

  // -------------------------------------------------------------------------
  // Kill switch
  // -------------------------------------------------------------------------

  /**
   * Suspends trading when an unexplained imbalance survives self-healing.
   *
   * Halting is the conservative choice: if the books are wrong, every further
   * trade prices against numbers nobody can vouch for and deepens the hole.
   */
  private async raiseBreachAlarm(runId: string, critical: Finding[]) {
    const reason = `Reconciliation run ${runId} found ${critical.length} unresolved critical exception(s): ${critical
      .map((finding) => finding.checkName)
      .join(", ")}`;

    await this.setHalt(true, reason.slice(0, 255), runId);

    await recordAuditDetached({
      category: "RECONCILIATION",
      eventType: "BREACH_ALARM_TRADING_HALTED",
      severity: "CRITICAL",
      referenceId: runId,
      payload: {
        critical_count: critical.length,
        checks: critical.map((finding) => ({
          check: finding.checkName,
          subject: finding.subjectId,
          expected: finding.expected,
          actual: finding.actual,
        })),
      },
    });

    realtimeHub.publish("market", "trading_halted", { reason });
    console.error(`[reconciliation] BREACH ALARM: ${reason}`);
  }

  async getHaltState() {
    const [rows]: any = await pool.execute(
      `SELECT config_key, config_value FROM platform_config
       WHERE config_key IN (?, ?, ?)`,
      [
        PLATFORM_CONFIG_KEYS.TRADING_HALTED,
        PLATFORM_CONFIG_KEYS.HALT_REASON,
        PLATFORM_CONFIG_KEYS.LAST_RECONCILIATION_RUN_ID,
      ],
    );

    const config = Object.fromEntries(
      rows.map((row: any) => [row.config_key, row.config_value]),
    );

    return {
      halted: config[PLATFORM_CONFIG_KEYS.TRADING_HALTED] === "true",
      reason: config[PLATFORM_CONFIG_KEYS.HALT_REASON] ?? "",
      run_id: config[PLATFORM_CONFIG_KEYS.LAST_RECONCILIATION_RUN_ID] ?? "",
    };
  }

  /** Manual override, used by a fund manager to halt or resume trading. */
  async setHalt(
    halted: boolean,
    reason: string,
    runId = "",
    actorUserId?: string,
  ) {
    await this.writeConfig(PLATFORM_CONFIG_KEYS.TRADING_HALTED, String(halted));
    await this.writeConfig(PLATFORM_CONFIG_KEYS.HALT_REASON, halted ? reason : "");
    await this.writeConfig(
      PLATFORM_CONFIG_KEYS.LAST_RECONCILIATION_RUN_ID,
      halted ? runId : "",
    );

    if (actorUserId) {
      await recordAuditDetached({
        userId: actorUserId,
        category: "ADMIN",
        eventType: halted ? "TRADING_HALTED_MANUALLY" : "TRADING_RESUMED",
        severity: "CRITICAL",
        referenceId: runId || null,
        payload: { reason },
      });

      realtimeHub.publish("market", halted ? "trading_halted" : "trading_resumed", {
        reason,
      });
    }

    return this.getHaltState();
  }

  private async writeConfig(key: string, value: string) {
    await pool.execute(
      `INSERT INTO platform_config (config_key, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
      [key, value],
    );
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async listRuns(limit = 20) {
    const [rows]: any = await pool.query(
      `SELECT run_id, business_date, status, ledger_total_etb, bank_total_etb,
              variance_etb, matched_count, unmatched_count, self_healed_count,
              started_at, completed_at
       FROM reconciliation_runs
       ORDER BY started_at DESC
       LIMIT ?`,
      [limit],
    );

    return rows.map((row: any) => ({
      ...row,
      ledger_total_etb: toCash(row.ledger_total_etb),
      bank_total_etb: toCash(row.bank_total_etb),
      variance_etb: toCash(row.variance_etb),
    }));
  }

  async describeRun(runId: string) {
    const [[run]]: any = await pool.execute(
      "SELECT * FROM reconciliation_runs WHERE run_id = ? LIMIT 1",
      [runId],
    );

    if (!run) {
      throw new Error(`No reconciliation run ${runId}`);
    }

    const [exceptions]: any = await pool.execute(
      `SELECT exception_id, check_name, subject_id, exception_type, severity,
              expected_amount_etb, actual_amount_etb, resolution_status, notes, created_at
       FROM reconciliation_exceptions
       WHERE run_id = ?
       ORDER BY severity DESC, exception_id`,
      [runId],
    );

    return {
      run_id: run.run_id,
      business_date: run.business_date,
      status: run.status,
      ledger_total_etb: toCash(run.ledger_total_etb),
      bank_total_etb: toCash(run.bank_total_etb),
      variance_etb: toCash(run.variance_etb),
      matched_count: run.matched_count,
      unmatched_count: run.unmatched_count,
      self_healed_count: run.self_healed_count,
      started_at: run.started_at,
      completed_at: run.completed_at,
      exceptions: exceptions.map((row: any) => ({
        exception_id: Number(row.exception_id),
        check_name: row.check_name,
        subject_id: row.subject_id,
        exception_type: row.exception_type,
        severity: row.severity,
        expected_amount_etb: toCash(row.expected_amount_etb),
        actual_amount_etb: toCash(row.actual_amount_etb),
        resolution_status: row.resolution_status,
        notes: row.notes,
        created_at: row.created_at,
      })),
    };
  }
}

export const reconciliationService = new ReconciliationService();
export { CASH_TOLERANCE, SHARE_TOLERANCE };
