import { PoolConnection } from "mysql2/promise";
import pool from "./database.config";

/**
 * Runs a unit of work inside a single database transaction.
 *
 * Every financial mutation on the platform (share transfers, escrow shifts,
 * yield payouts) must move money and shares in one indivisible step, so all of
 * them route through here. The callback receives the transaction-scoped
 * connection and must use it for every query; using the global pool inside the
 * callback would silently escape the transaction.
 */
export class TransactionManager {
  async executeTransaction<T>(
    work: (connection: PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const transactionManager = new TransactionManager();

/**
 * Convenience wrapper for callers that only need the transaction semantics and
 * not their own manager instance.
 */
export function withTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  return transactionManager.executeTransaction(work);
}
