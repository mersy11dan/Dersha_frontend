/**
 * Fixed identifiers for the non-login accounts seeded by dirsha_db_v2.sql.
 * Escrow pools hold real balances, and every balance table has a foreign key to
 * users, so these pools exist as rows rather than as magic strings.
 */
export const SYSTEM_ACCOUNTS = {
  PRIMARY_CROWDFUNDING_POOL: "00000000-0000-4000-8000-000000000001",
  AMM_LIQUIDITY_BUFFER: "00000000-0000-4000-8000-000000000002",
  GOVERNMENT_TAX_LEDGER: "00000000-0000-4000-8000-000000000003",
  PLATFORM_FEE_ACCOUNT: "00000000-0000-4000-8000-000000000004",
  BASKET_CUSTODY_POOL: "00000000-0000-4000-8000-000000000005",
} as const;

export type SystemAccountId =
  (typeof SYSTEM_ACCOUNTS)[keyof typeof SYSTEM_ACCOUNTS];

export const PLATFORM_CONFIG_KEYS = {
  TRADING_HALTED: "TRADING_HALTED",
  HALT_REASON: "HALT_REASON",
  AMM_BUFFER_CAPITAL_ETB: "AMM_BUFFER_CAPITAL_ETB",
  LAST_RECONCILIATION_RUN_ID: "LAST_RECONCILIATION_RUN_ID",
} as const;
