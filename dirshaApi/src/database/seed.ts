/**
 * Seeds demo accounts for local development.
 *
 * Idempotent: re-running tops balances back up rather than creating duplicates.
 * These accounts are development fixtures and use a shared, well-known
 * password, so never run this against a production database.
 */
import argon2 from "argon2";
import pool from "./database.config";
import { env } from "../config/env";
import { cashLiteral } from "../utils/money";

export const DEMO_PASSWORD = "Dersha#2026";

export const DEMO_USERS = [
  {
    key: "manager",
    userId: "10000000-0000-4000-8000-000000000001",
    fullName: "Selamawit Fund Management",
    email: "manager@dersha.test",
    phone: "+251911000001",
    role: "FUND_MANAGER" as const,
    faydaMasked: "FYD-****-0001",
    openingBalance: 0,
  },
  {
    key: "owner",
    userId: "10000000-0000-4000-8000-000000000002",
    fullName: "Bekele Asset Owner",
    email: "owner@dersha.test",
    phone: "+251911000002",
    role: "INVESTOR" as const,
    faydaMasked: "FYD-****-0002",
    openingBalance: 50_000,
  },
  {
    key: "investorA",
    userId: "10000000-0000-4000-8000-000000000003",
    fullName: "Hanna Tesfaye",
    email: "hanna@dersha.test",
    phone: "+251911000003",
    role: "INVESTOR" as const,
    faydaMasked: "FYD-****-0003",
    openingBalance: 500_000,
  },
  {
    key: "investorB",
    userId: "10000000-0000-4000-8000-000000000004",
    fullName: "Dawit Alemu",
    email: "dawit@dersha.test",
    phone: "+251911000004",
    role: "INVESTOR" as const,
    faydaMasked: "FYD-****-0004",
    openingBalance: 500_000,
  },
] as const;

/**
 * Transactional tables, ordered so a plain DELETE would respect the foreign
 * keys. TRUNCATE with checks disabled is faster, but the order documents the
 * dependency graph for anyone reading it.
 */
const TRANSACTIONAL_TABLES = [
  "reconciliation_exceptions",
  "reconciliation_runs",
  "tax_withholding_ledger",
  "sub_fund_yield_investor_payouts",
  "sub_fund_yield_distributions",
  "creator_royalty_ledger",
  "basket_nav_snapshots",
  "basket_listings",
  "custom_basket_balances",
  "custom_basket_constituents",
  "custom_baskets",
  "trade_fills",
  "orders",
  "share_vesting_locks",
  "sub_fund_securities_ledger",
  "sub_fund_balances",
  "sub_funds",
  "custody_confirmations",
  "asset_appraisals",
  "assets_master",
  "wallet_escrow_records",
  "financial_transactions_ledger",
  "linked_funding_sources",
  "security_audit_logs",
];

const SYSTEM_ACCOUNT_IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
];

const AMM_BUFFER_CAPITAL_ETB = 5_000_000;

/**
 * Clears every trace of trading activity and returns the demo accounts to their
 * opening balances, so the full lifecycle can be replayed from a known state.
 * Accounts created by earlier runs are removed; system pools and the demo four
 * survive.
 */
export async function resetDemoData() {
  if (env.nodeEnv === "production") {
    throw new Error("Refusing to reset data in production.");
  }

  const keepIds = [
    ...SYSTEM_ACCOUNT_IDS,
    ...DEMO_USERS.map((user) => user.userId),
  ];

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of TRANSACTIONAL_TABLES) {
      await pool.query(`TRUNCATE TABLE \`${table}\``);
    }

    // Throwaway accounts from previous smoke runs; their wallets cascade.
    await pool.query(
      `DELETE FROM users WHERE user_id NOT IN (${keepIds.map(() => "?").join(",")})`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM wallets WHERE user_id NOT IN (${keepIds.map(() => "?").join(",")})`,
      keepIds,
    );
  } finally {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  await pool.execute(
    `UPDATE wallets SET available_balance_etb = ?, escrowed_balance_etb = 0
     WHERE user_id = ?`,
    [cashLiteral(AMM_BUFFER_CAPITAL_ETB), SYSTEM_ACCOUNT_IDS[1]],
  );
  await pool.query(
    `UPDATE wallets SET available_balance_etb = 0, escrowed_balance_etb = 0
     WHERE user_id IN (?, ?, ?, ?)`,
    [
      SYSTEM_ACCOUNT_IDS[0],
      SYSTEM_ACCOUNT_IDS[2],
      SYSTEM_ACCOUNT_IDS[3],
      SYSTEM_ACCOUNT_IDS[4],
    ],
  );

  // A halt left behind by a reconciliation test would block the next run.
  await pool.query(
    `UPDATE platform_config SET config_value = 'false' WHERE config_key = 'TRADING_HALTED'`,
  );
  await pool.query(
    `UPDATE platform_config SET config_value = '' WHERE config_key IN ('HALT_REASON','LAST_RECONCILIATION_RUN_ID')`,
  );
}

/**
 * @param exactBalances when true, wallets are set to the opening balance rather
 * than topped up to it, which is what a reset needs.
 */
export async function seedDemoUsers({ exactBalances = false } = {}) {
  if (env.nodeEnv === "production") {
    throw new Error("Refusing to seed demo accounts in production.");
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  for (const user of DEMO_USERS) {
    await pool.execute(
      `INSERT INTO users
        (user_id, full_name_raw, email_address, phone_number_eth, password_hash,
         fayda_id_number_masked, date_of_birth, account_status, role, is_diaspora_account)
       VALUES (?, ?, ?, ?, ?, ?, '1990-01-01', 'ACTIVE_VERIFIED', ?, 0)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         account_status = 'ACTIVE_VERIFIED',
         role = VALUES(role)`,
      [
        user.userId,
        user.fullName,
        user.email,
        user.phone,
        passwordHash,
        user.faydaMasked,
        user.role,
      ],
    );

    // The users trigger provisions the wallet; this only sets the balance.
    await pool.execute(
      `INSERT INTO wallets (user_id, available_balance_etb, escrowed_balance_etb, currency_code)
       VALUES (?, ?, 0.0000, 'ETB')
       ON DUPLICATE KEY UPDATE
         available_balance_etb = ${
           exactBalances
             ? "VALUES(available_balance_etb)"
             : "GREATEST(available_balance_etb, VALUES(available_balance_etb))"
         },
         escrowed_balance_etb = ${exactBalances ? "0.0000" : "escrowed_balance_etb"}`,
      [user.userId, cashLiteral(user.openingBalance)],
    );
  }

  return DEMO_USERS;
}

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    await resetDemoData();
    console.log("[seed] transactional tables cleared");
  }

  const users = await seedDemoUsers({ exactBalances: reset });
  console.log("[seed] demo accounts ready (password for all: " + DEMO_PASSWORD + ")");
  console.table(
    users.map((u) => ({
      email: u.email,
      role: u.role,
      opening_balance_etb: u.openingBalance,
    })),
  );
  await pool.end();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  });
}
