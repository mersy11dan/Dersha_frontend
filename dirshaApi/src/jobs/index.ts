import { orderService } from "../services/order.service";
import { basketService } from "../services/basket.service";
import { releaseMaturedVestingLocks } from "./vesting.job";
import {
  startReconciliationCron,
  stopReconciliationCron,
} from "./reconciliation.job";

const AMM_SWEEP_INTERVAL_MS = 10_000;
const NAV_REFRESH_INTERVAL_MS = 30_000;
const VESTING_SWEEP_INTERVAL_MS = 60 * 60 * 1000;

const timers: NodeJS.Timeout[] = [];

/**
 * Starts the recurring platform jobs.
 *
 * The AMM sweep runs frequently because sellers are waiting on it; vesting
 * releases and reconciliation are far less time-sensitive.
 */
export function startBackgroundJobs() {
  const ammTimer = setInterval(() => {
    void orderService
      .runAmmBuybackSweep()
      .then((result) => {
        if (result.processed > 0) {
          console.log(
            `[amm] absorbed ${result.totalShares} shares across ${result.processed} order(s) for ${result.totalPaidEtb} ETB`,
          );
        }
      })
      .catch((error) => console.error("[amm] sweep failed", error));
  }, AMM_SWEEP_INTERVAL_MS);

  // Trades already trigger a targeted recalculation. This is the safety net for
  // prices that move outside the matching engine, such as a revaluation.
  const navTimer = setInterval(() => {
    void basketService
      .recalculateAll()
      .catch((error) => console.error("[nav] periodic refresh failed", error));
  }, NAV_REFRESH_INTERVAL_MS);

  const vestingTimer = setInterval(() => {
    void releaseMaturedVestingLocks().catch((error) =>
      console.error("[vesting] release sweep failed", error),
    );
  }, VESTING_SWEEP_INTERVAL_MS);

  // Timers must not hold the event loop open on shutdown.
  ammTimer.unref();
  navTimer.unref();
  vestingTimer.unref();
  timers.push(ammTimer, navTimer, vestingTimer);

  void releaseMaturedVestingLocks().catch(() => {});
  startReconciliationCron();

  console.log("[jobs] AMM sweep, basket NAV refresh and vesting release scheduled");
}

export function stopBackgroundJobs() {
  while (timers.length) clearInterval(timers.pop()!);
  stopReconciliationCron();
}
