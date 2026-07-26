import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { recordAudit } from "../repository/AuditRepository";
import { toShares } from "../utils/money";

/**
 * Frees owner-retained shares once their vesting period has elapsed.
 *
 * Locks are released one at a time in their own transaction, so a single bad
 * row cannot block every other owner's shares from unlocking.
 */
export async function releaseMaturedVestingLocks(): Promise<number> {
  const [matured]: any = await pool.execute(
    `SELECT vesting_id, user_id, sub_fund_id, shares_locked
     FROM share_vesting_locks
     WHERE released = 0 AND unlock_at <= NOW()`,
  );

  let released = 0;

  for (const lock of matured) {
    try {
      await withTransaction(async (connection) => {
        const securities = new SecuritiesRepository(connection);

        await securities.unlockShares(
          connection,
          lock.user_id,
          lock.sub_fund_id,
          toShares(lock.shares_locked),
        );

        await connection.execute(
          `UPDATE share_vesting_locks
           SET released = 1, released_at = CURRENT_TIMESTAMP
           WHERE vesting_id = ? AND released = 0`,
          [lock.vesting_id],
        );

        await recordAudit(connection, {
          userId: lock.user_id,
          category: "TRADING",
          eventType: "VESTING_LOCK_RELEASED",
          referenceId: lock.vesting_id,
          payload: {
            sub_fund_id: lock.sub_fund_id,
            shares: toShares(lock.shares_locked),
          },
        });
      });
      released += 1;
    } catch (error) {
      console.error(`[vesting] failed to release lock ${lock.vesting_id}`, error);
    }
  }

  if (released > 0) {
    console.log(`[vesting] released ${released} matured lock(s)`);
  }

  return released;
}
