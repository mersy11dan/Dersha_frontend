/**
 * Flow 5 smoke test: the yield router with 10% withholding tax and basket
 * look-through, the reconciliation engine's invariant checks and self-healing
 * patch, and the breach-alarm kill switch.
 *
 * Requires the API to be running and `npm run seed` to have been executed.
 */
import { createHash, randomUUID } from "node:crypto";
import pool from "../src/database/database.config";
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";
import { SYSTEM_ACCOUNTS } from "../src/constants/systemAccounts";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL  ${label}`, JSON.stringify(detail ?? "", null, 2));
  }
}

const near = (a: number, b: number, tolerance = 0.02) =>
  Math.abs(a - b) <= tolerance;
const key = (prefix: string) => `${prefix}-${randomUUID()}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: (await response.json().catch(() => ({}))) as any,
  };
}

const byKey = (k: string) => DEMO_USERS.find((u) => u.key === k)!;

async function login(email: string) {
  const result = await call("POST", "/auth/login", {
    email_address: email,
    password_plain: DEMO_PASSWORD,
  });
  return result.body?.data?.token as string;
}

async function available(token: string) {
  const balance = await call("GET", "/wallet/balance", undefined, token);
  return balance.body?.data?.available_balance_etb as number;
}

async function systemBalance(userId: string) {
  const [rows]: any = await pool.execute(
    "SELECT available_balance_etb FROM wallets WHERE user_id = ?",
    [userId],
  );
  return Number(rows[0]?.available_balance_etb ?? 0);
}

/** Tops a wallet up through the real deposit path so the ledger stays honest. */
async function fund(token: string, amount: number) {
  const before = await available(token);
  await call(
    "POST",
    "/wallet/deposit",
    {
      amount_etb: amount,
      payment_channel: "TELEBIRR",
      idempotency_key: `IDEM-DEPOSIT-${randomUUID()}`,
    },
    token,
  );

  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(500);
    if ((await available(token)) >= before + amount) return true;
  }
  return false;
}

async function main() {
  const managerToken = await login(byKey("manager").email);
  const hannaToken = await login(byKey("investorA").email);
  const dawitToken = await login(byKey("investorB").email);

  console.log("\n[fixtures]");
  const funded = await fund(managerToken, 200_000);
  check("the fund manager's revenue account is funded", funded);

  const runId = randomUUID().slice(0, 8);
  const asset = await call(
    "POST",
    "/assets",
    {
      asset_name: `Yield Tower ${runId}`,
      category: "REAL_ESTATE",
      physical_location_description: "Kazanchis commercial tower, Addis Ababa",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Highland Valuers PLC",
      surveyor_ecma_license_ref: `ECMA-YLD-${runId}`,
      appraised_value_etb: 1_000_000,
      appraisal_date: "2026-05-20",
      report_document_checksum: createHash("sha256")
        .update(`yield-report-${runId}`)
        .digest("hex"),
    },
    managerToken,
  );
  const assetId = asset.body?.data?.asset_id;

  await call(
    "POST",
    `/assets/${assetId}/custody`,
    {
      custodian_bank_name: "Dashen Bank Custody",
      trust_deed_reference: `TD-YLD-${runId}`,
      registry_office: "Addis Ababa City Land Registry",
      vault_receipt_reference: `VLT-YLD-${runId}`,
    },
    managerToken,
  );

  const mint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    {
      total_issued_shares: 1000,
      nominal_price_per_share_etb: 100,
      public_offering_percentage: 100,
    },
    managerToken,
  );
  const subFundId = mint.body?.data?.sub_fund_id;

  // Hanna takes 400 and wraps 200 of them into a basket; Dawit takes 200.
  // The pool keeps the unsold 400.
  await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 400, idempotency_key: key("SUB") },
    hannaToken,
  );
  await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 200, idempotency_key: key("SUB") },
    dawitToken,
  );

  const sideAsset = await call(
    "POST",
    "/assets",
    {
      asset_name: `Yield Side Leg ${runId}`,
      category: "AGRICULTURE",
      physical_location_description: "Sidama Zone coffee washing station",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Highland Valuers PLC",
      surveyor_ecma_license_ref: `ECMA-YSL-${runId}`,
      appraised_value_etb: 500_000,
      appraisal_date: "2026-05-20",
      report_document_checksum: createHash("sha256")
        .update(`yield-side-${runId}`)
        .digest("hex"),
    },
    managerToken,
  );
  await call(
    "POST",
    `/assets/${sideAsset.body?.data?.asset_id}/custody`,
    {
      custodian_bank_name: "Dashen Bank Custody",
      trust_deed_reference: `TD-YSL-${runId}`,
      registry_office: "Sidama Regional Land Registry",
      vault_receipt_reference: `VLT-YSL-${runId}`,
    },
    managerToken,
  );
  const sideMint = await call(
    "POST",
    `/assets/${sideAsset.body?.data?.asset_id}/tokenize`,
    {
      total_issued_shares: 1000,
      nominal_price_per_share_etb: 50,
      public_offering_percentage: 100,
    },
    managerToken,
  );
  await call(
    "POST",
    `/assets/sub-funds/${sideMint.body?.data?.sub_fund_id}/subscribe`,
    { shares: 100, idempotency_key: key("SUB") },
    hannaToken,
  );

  const basket = await call(
    "POST",
    "/baskets",
    {
      basket_name: `Yield Wrapper ${runId}`,
      total_basket_shares: 100,
      constituents: [
        { sub_fund_id: subFundId, shares_allocated: 200 },
        {
          sub_fund_id: sideMint.body?.data?.sub_fund_id,
          shares_allocated: 100,
        },
      ],
      idempotency_key: key("MINT"),
    },
    hannaToken,
  );
  const basketId = basket.body?.data?.basket_id;

  const listing = await call(
    "POST",
    `/baskets/${basketId}/list`,
    {
      sale_mode: "FRACTIONAL_POOL",
      total_basket_shares_listed: 50,
      price_per_unit_etb: 50,
      idempotency_key: key("LIST"),
    },
    hannaToken,
  );
  await call(
    "POST",
    `/baskets/listings/${listing.body?.data?.listing_id}/buy`,
    { basket_shares: 50, idempotency_key: key("BUY") },
    dawitToken,
  );

  console.log("\n[yield distribution]");
  const hannaBefore = await available(hannaToken);
  const dawitBefore = await available(dawitToken);
  const managerBefore = await available(managerToken);
  const taxBefore = await systemBalance(SYSTEM_ACCOUNTS.GOVERNMENT_TAX_LEDGER);
  const feeBefore = await systemBalance(SYSTEM_ACCOUNTS.PLATFORM_FEE_ACCOUNT);

  const distribution = await call(
    "POST",
    `/yield/sub-funds/${subFundId}/distributions`,
    {
      yield_category: "REAL_ESTATE_RENT",
      gross_revenue_collected_etb: 120_000,
      opex_deductions_etb: 15_000,
      platform_fees_retained_etb: 5_000,
      reporting_period_start: "2026-04-01",
      reporting_period_end: "2026-06-30",
      idempotency_key: key("YIELD"),
    },
    managerToken,
  );
  check("distribution accepted", distribution.status === 201, distribution.body);

  const distributable = 120_000 - 15_000 - 5_000; // 100,000 ETB
  const data = distribution.body?.data;
  check(
    "the distributable pot is revenue less opex and fees",
    near(data?.total_tax_withheld_etb + data?.net_amount_disbursed_etb, distributable),
    data,
  );
  check(
    "10 percent is withheld for the revenue authority",
    near(data?.total_tax_withheld_etb, distributable * 0.1),
    { withheld: data?.total_tax_withheld_etb },
  );
  check(
    "investors receive 90 percent net",
    near(data?.net_amount_disbursed_etb, distributable * 0.9),
    { net: data?.net_amount_disbursed_etb },
  );

  console.log("\n[pro-rata allocation]");
  const payouts = data?.payouts ?? [];
  const totalGross = payouts.reduce(
    (sum: number, p: any) => sum + p.gross_payout_etb,
    0,
  );
  check(
    "every birr of the pot is allocated",
    near(totalGross, distributable),
    { totalGross, distributable },
  );
  check(
    "each payout withholds exactly 10 percent",
    payouts.every((p: any) => near(p.tax_withheld_etb, p.gross_payout_etb * 0.1, 0.01)),
    payouts,
  );

  // 1,000 shares: pool 400, Hanna 200 direct, Dawit 200 direct, and 200 in
  // basket custody split evenly between Hanna and Dawit.
  const hannaDirect = payouts.find(
    (p: any) =>
      p.user_id === byKey("investorA").userId && p.payout_source === "DIRECT_HOLDING",
  );
  const hannaBasket = payouts.find(
    (p: any) =>
      p.user_id === byKey("investorA").userId &&
      p.payout_source === "BASKET_CONSTITUENT",
  );
  const poolPayout = payouts.find(
    (p: any) => p.user_id === SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
  );

  check(
    "the direct holding of 200 shares earns 20 percent of the pot",
    hannaDirect && near(hannaDirect.gross_payout_etb, distributable * 0.2, 1),
    hannaDirect,
  );
  check(
    "basket holders are paid through to the constituent",
    hannaBasket && near(hannaBasket.shares_held_at_record, 100),
    hannaBasket,
  );
  check(
    "the basket claim is attributed to its basket",
    hannaBasket?.basket_id === basketId,
    hannaBasket,
  );
  check(
    "unsold shares in the crowdfunding pool retain their yield",
    poolPayout && near(poolPayout.shares_held_at_record, 400),
    poolPayout,
  );

  console.log("\n[cash movements]");
  const hannaAfter = await available(hannaToken);
  const dawitAfter = await available(dawitToken);
  const managerAfter = await available(managerToken);
  const taxAfter = await systemBalance(SYSTEM_ACCOUNTS.GOVERNMENT_TAX_LEDGER);
  const feeAfter = await systemBalance(SYSTEM_ACCOUNTS.PLATFORM_FEE_ACCOUNT);

  const hannaExpected =
    (hannaDirect?.net_payout_etb ?? 0) + (hannaBasket?.net_payout_etb ?? 0);
  check(
    "the investor's wallet receives the net payout",
    near(hannaAfter - hannaBefore, hannaExpected, 0.05),
    { before: hannaBefore, after: hannaAfter, expected: hannaExpected },
  );
  check(
    "withheld tax lands in the government ledger",
    near(taxAfter - taxBefore, data?.total_tax_withheld_etb),
    { before: taxBefore, after: taxAfter },
  );
  check(
    "the platform fee is retained separately",
    near(feeAfter - feeBefore, 5_000),
    { before: feeBefore, after: feeAfter },
  );
  check(
    "the declaring account funds the whole distribution",
    near(managerBefore - managerAfter, distributable + 5_000),
    { before: managerBefore, after: managerAfter },
  );
  check(
    "cash is conserved across the distribution",
    near(
      hannaAfter -
        hannaBefore +
        (dawitAfter - dawitBefore) +
        (taxAfter - taxBefore) +
        (feeAfter - feeBefore) +
        (managerAfter - managerBefore),
      // Every wallet delta nets to zero, so the legs measured here must equal
      // the negative of the one leg not measured: the crowdfunding pool's slice.
      -(poolPayout?.net_payout_etb ?? 0),
      0.1,
    ),
    {
      investors: hannaAfter - hannaBefore + (dawitAfter - dawitBefore),
      tax: taxAfter - taxBefore,
      fees: feeAfter - feeBefore,
      manager: managerAfter - managerBefore,
    },
  );

  console.log("\n[idempotency and income statement]");
  const replayKey = key("YIELD");
  const first = await call(
    "POST",
    `/yield/sub-funds/${subFundId}/distributions`,
    {
      yield_category: "REAL_ESTATE_RENT",
      gross_revenue_collected_etb: 1_000,
      opex_deductions_etb: 0,
      platform_fees_retained_etb: 0,
      reporting_period_start: "2026-07-01",
      reporting_period_end: "2026-07-31",
      idempotency_key: replayKey,
    },
    managerToken,
  );
  const replay = await call(
    "POST",
    `/yield/sub-funds/${subFundId}/distributions`,
    {
      yield_category: "REAL_ESTATE_RENT",
      gross_revenue_collected_etb: 1_000,
      opex_deductions_etb: 0,
      platform_fees_retained_etb: 0,
      reporting_period_start: "2026-07-01",
      reporting_period_end: "2026-07-31",
      idempotency_key: replayKey,
    },
    managerToken,
  );
  check(
    "a replayed distribution returns the original instead of paying twice",
    first.body?.data?.distribution_id === replay.body?.data?.distribution_id,
    {
      first: first.body?.data?.distribution_id,
      replay: replay.body?.data?.distribution_id,
    },
  );

  const income = await call("GET", "/yield/income", undefined, hannaToken);
  check(
    "the investor income statement reports gross, tax and net",
    near(
      income.body?.data?.lifetime_gross_etb -
        income.body?.data?.lifetime_tax_withheld_etb,
      income.body?.data?.lifetime_net_etb,
      0.05,
    ),
    income.body?.data,
  );
  check(
    "the statement states the withholding rate",
    income.body?.data?.withholding_tax_rate === 0.1,
    income.body?.data?.withholding_tax_rate,
  );

  console.log("\n[reconciliation on healthy books]");
  const clean = await call("POST", "/admin/reconciliation/run", undefined, managerToken);
  check("reconciliation ran", clean.status === 200, clean.body);
  check(
    "the books balance after every flow",
    clean.body?.data?.status === "BALANCED",
    clean.body?.data?.findings,
  );
  check("trading is not halted", clean.body?.data?.trading_halted === false, clean.body?.data);

  console.log("\n[self-healing patch]");
  // Corrupt the cached escrow total while leaving the itemised escrow records
  // intact; the engine should restate the column from the records.
  await pool.execute(
    `UPDATE wallets SET escrowed_balance_etb = escrowed_balance_etb + 250.0000
     WHERE user_id = ?`,
    [byKey("investorA").userId],
  );

  const healRun = await call(
    "POST",
    "/admin/reconciliation/run",
    undefined,
    managerToken,
  );
  check(
    "the drift is detected and self-healed",
    healRun.body?.data?.self_healed_count === 1,
    healRun.body?.data?.findings,
  );
  check(
    "a self-healed warning does not halt trading",
    healRun.body?.data?.trading_halted === false,
    healRun.body?.data,
  );

  const healed = await call(
    "GET",
    `/admin/reconciliation/${healRun.body?.data?.run_id}`,
    undefined,
    managerToken,
  );
  check(
    "the patch is recorded as an exception, not hidden",
    (healed.body?.data?.exceptions ?? []).some(
      (e: any) =>
        e.exception_type === "ESCROW_DRIFT" && e.resolution_status === "SELF_HEALED",
    ),
    healed.body?.data?.exceptions,
  );

  const afterHeal = await call(
    "POST",
    "/admin/reconciliation/run",
    undefined,
    managerToken,
  );
  check(
    "the following run is clean again",
    afterHeal.body?.data?.status === "BALANCED",
    afterHeal.body?.data?.findings,
  );

  console.log("\n[breach alarm and kill switch]");
  // Inflate the issued supply so it no longer equals the sum of all holdings.
  // This is not repairable from data the platform holds, so it must escalate.
  await pool.execute(
    "UPDATE sub_funds SET total_issued_shares = total_issued_shares + 5 WHERE sub_fund_id = ?",
    [subFundId],
  );

  const breach = await call(
    "POST",
    "/admin/reconciliation/run",
    undefined,
    managerToken,
  );
  check(
    "an unexplained imbalance is flagged",
    breach.body?.data?.status === "VARIANCE_DETECTED",
    breach.body?.data?.findings,
  );
  check(
    "the supply mismatch is escalated rather than patched",
    (breach.body?.data?.findings ?? []).some(
      (f: any) => f.type === "SUPPLY_MISMATCH" && !f.healed,
    ),
    breach.body?.data?.findings,
  );
  check(
    "the breach alarm halts trading",
    breach.body?.data?.trading_halted === true,
    breach.body?.data,
  );

  const haltedOrder = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 1,
      target_price_per_share_etb: 100,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check(
    "orders are refused while trading is halted",
    haltedOrder.body?.code === "TRADING_HALTED",
    haltedOrder.body,
  );

  const haltedBasketBuy = await call(
    "POST",
    `/baskets/listings/${listing.body?.data?.listing_id}/buy`,
    { basket_shares: 1, idempotency_key: key("BUY") },
    dawitToken,
  );
  check(
    "basket purchases are refused too",
    haltedBasketBuy.body?.code === "TRADING_HALTED",
    haltedBasketBuy.body,
  );

  const status = await call("GET", "/admin/trading-status", undefined, dawitToken);
  check(
    "the halt reason is visible to investors",
    status.body?.data?.halted === true && status.body?.data?.reason.length > 0,
    status.body?.data,
  );

  console.log("\n[recovery]");
  await pool.execute(
    "UPDATE sub_funds SET total_issued_shares = total_issued_shares - 5 WHERE sub_fund_id = ?",
    [subFundId],
  );

  const stillHalted = await call(
    "POST",
    "/admin/reconciliation/run",
    undefined,
    managerToken,
  );
  check(
    "the books balance once the cause is fixed",
    stillHalted.body?.data?.status === "BALANCED",
    stillHalted.body?.data?.findings,
  );
  check(
    "a clean run does not silently resume trading",
    stillHalted.body?.data?.trading_halted === true,
    stillHalted.body?.data,
  );

  const resume = await call(
    "POST",
    "/admin/trading-halt",
    { halted: false },
    managerToken,
  );
  check("an operator can resume trading", resume.body?.data?.halted === false, resume.body);

  const resumedOrder = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 1,
      target_price_per_share_etb: 100,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check("trading works again after the resume", resumedOrder.status === 201, resumedOrder.body);
  await call(
    "POST",
    `/orders/${resumedOrder.body?.data?.order_id}/cancel`,
    undefined,
    dawitToken,
  );

  const investorHalt = await call(
    "POST",
    "/admin/trading-halt",
    { halted: true, reason: "investor attempt" },
    dawitToken,
  );
  check(
    "an investor cannot touch the kill switch",
    investorHalt.status === 403,
    investorHalt.body,
  );

  await pool.end();
  console.log(
    failures === 0
      ? "\nAll Flow 5 checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await pool.end().catch(() => {});
  process.exit(1);
});
