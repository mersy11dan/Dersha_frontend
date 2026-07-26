import { Pool, PoolConnection } from "mysql2/promise";
import { ChangeResponseType } from "../types/return.types";

/**
 * Anything able to run a query: the shared pool for standalone reads, or a
 * dedicated connection when the caller is inside a transaction.
 */
export type SqlExecutor = Pool | PoolConnection;

/**
 * Base class for every repository.
 *
 * Repositories are always constructed with an explicit executor rather than
 * reaching for the pool themselves, so a repository created inside a
 * transaction stays inside it.
 */
export abstract class ParentRepository<TSave, TUpdate, TFetch> {
  protected connection: SqlExecutor;

  constructor(connection: SqlExecutor) {
    this.connection = connection;
  }

  abstract saveData(data: TSave): Promise<ChangeResponseType<any>>;

  abstract updateData(data: TUpdate): Promise<ChangeResponseType<any>>;

  abstract findAll(): Promise<TFetch>;
}
