/**
 * Development helper: prints the current state of the ledger tables.
 * Run with: npx tsx scripts/inspect-db.ts
 */
import pool from "../src/database/database.config";

async function main() {
  const [triggers]: any = await pool.query("SHOW TRIGGERS");
  console.log(
    "triggers:",
    triggers.map((t: any) => t.Trigger).join(", ") || "(none)",
  );

  const [systemUsers]: any = await pool.query(
    "SELECT user_id, full_name_raw, role FROM users WHERE role = 'SYSTEM'",
  );
  console.log("\nsystem accounts:");
  console.table(systemUsers);

  const [wallets]: any = await pool.query(
    `SELECT u.full_name_raw, w.available_balance_etb, w.escrowed_balance_etb
     FROM wallets w JOIN users u ON u.user_id = w.user_id
     ORDER BY u.created_at`,
  );
  console.log("\nwallets:");
  console.table(wallets);

  const [config]: any = await pool.query(
    "SELECT config_key, config_value FROM platform_config",
  );
  console.log("\nplatform config:");
  console.table(config);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
