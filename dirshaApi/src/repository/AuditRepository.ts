import { PoolConnection } from "mysql2/promise";
import pool from "../database/database.config";

export type AuditCategory =
  | "AUTHENTICATION"
  | "KYC"
  | "WALLET"
  | "TRADING"
  | "BASKET"
  | "YIELD"
  | "RECONCILIATION"
  | "ADMIN";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AuditEntry {
  userId?: string | null;
  category: AuditCategory;
  eventType: string;
  severity?: AuditSeverity;
  referenceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload?: Record<string, unknown> | null;
}

const INSERT_SQL = `
  INSERT INTO security_audit_logs
    (user_id, event_category, event_type, severity, reference_id, ip_address, user_agent, payload_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

function toParams(entry: AuditEntry) {
  return [
    entry.userId ?? null,
    entry.category,
    entry.eventType,
    entry.severity ?? "INFO",
    entry.referenceId ?? null,
    entry.ipAddress ?? null,
    entry.userAgent?.slice(0, 255) ?? null,
    entry.payload ? JSON.stringify(entry.payload) : null,
  ];
}

/**
 * Writes an audit row using the caller's transaction, so the trace commits or
 * rolls back together with the operation it describes.
 */
export async function recordAudit(
  connection: PoolConnection,
  entry: AuditEntry,
): Promise<void> {
  await connection.execute(INSERT_SQL, toParams(entry));
}

/**
 * Writes an audit row outside any transaction, for events that must survive a
 * rollback (failed logins, rejected KYC attempts, breach alarms).
 *
 * Audit logging must never be the reason a request fails, so errors here are
 * logged and swallowed.
 */
export async function recordAuditDetached(entry: AuditEntry): Promise<void> {
  try {
    await pool.execute(INSERT_SQL, toParams(entry));
  } catch (error) {
    console.error("[audit] failed to persist audit entry", entry.eventType, error);
  }
}
