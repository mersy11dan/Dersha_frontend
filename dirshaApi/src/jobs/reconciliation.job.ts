import cron, { ScheduledTask } from "node-cron";
import { env } from "../config/env";
import { reconciliationService } from "../services/reconciliation.service";

let task: ScheduledTask | null = null;

/**
 * Schedules the nightly reconciliation.
 *
 * It runs at 04:00 Africa/Addis_Ababa: after the previous day's settlement has
 * closed and before the market opens, so a breach alarm halts trading before
 * anyone can trade against books that have not been proven.
 */
export function startReconciliationCron() {
  if (!cron.validate(env.reconciliation.cron)) {
    console.error(
      `[reconciliation] invalid RECONCILIATION_CRON "${env.reconciliation.cron}"; nightly run not scheduled`,
    );
    return;
  }

  task = cron.schedule(
    env.reconciliation.cron,
    () => {
      void runReconciliationNow();
    },
    { timezone: env.reconciliation.timezone },
  );

  console.log(
    `[jobs] reconciliation scheduled at "${env.reconciliation.cron}" (${env.reconciliation.timezone})`,
  );
}

export async function runReconciliationNow() {
  try {
    const report = await reconciliationService.run();
    const summary = `[reconciliation] ${report.status}: ${report.matched_count} matched, ${report.self_healed_count} self-healed, ${report.unmatched_count} unresolved`;

    if (report.status === "BALANCED") console.log(summary);
    else console.warn(summary);

    if (report.trading_halted) {
      console.error("[reconciliation] trading is halted pending manual review");
    }

    return report;
  } catch (error) {
    console.error("[reconciliation] run failed", error);
    return null;
  }
}

export function stopReconciliationCron() {
  void task?.stop();
  task = null;
}
