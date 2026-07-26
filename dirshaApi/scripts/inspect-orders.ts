/**
 * Development helper: prints resting orders and the escrow rows backing them,
 * which is the fastest way to explain an unexpected escrowed balance.
 * Run with: npx tsx scripts/inspect-orders.ts
 */
import pool from "../src/database/database.config";

async function main() {
  const [orders]: any = await pool.query(
    `SELECT u.email_address, o.order_id, a.asset_name, o.direction, o.order_type,
            o.status, o.total_shares_ordered, o.filled_shares_accumulated,
            o.target_price_per_share_etb, o.created_at
     FROM orders o
     JOIN users u ON u.user_id = o.user_id
     JOIN sub_funds sf ON sf.sub_fund_id = o.sub_fund_id
     JOIN assets_master a ON a.asset_id = sf.asset_id
     WHERE o.status IN ('PENDING','PARTIALLY_FILLED')
     ORDER BY o.created_at`,
  );
  console.log("open orders:");
  console.table(orders);

  const [escrow]: any = await pool.query(
    `SELECT u.email_address, e.escrow_id, e.reason_code, e.amount_etb,
            e.status, e.related_order_id, e.created_at
     FROM wallet_escrow_records e
     JOIN wallets w ON w.wallet_id = e.wallet_id
     JOIN users u ON u.user_id = w.user_id
     WHERE e.status = 'HELD'
     ORDER BY e.created_at`,
  );
  console.log("\nheld escrow:");
  console.table(escrow);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
