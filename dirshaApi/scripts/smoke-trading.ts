/**
 * Flow 3 smoke test: escrow, price-time FIFO matching, settlement, cancellation
 * and the AMM liquidity buyback.
 *
 * Requires the API to be running and `npm run seed` to have been executed.
 */
import { createHash, randomUUID } from "node:crypto";
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL  ${label}`, JSON.stringify(detail ?? "", null, 2));
  }
}

const near = (a: number, b: number, tolerance = 0.01) =>
  Math.abs(a - b) <= tolerance;

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

async function login(email: string) {
  const result = await call("POST", "/auth/login", {
    email_address: email,
    password_plain: DEMO_PASSWORD,
  });
  return result.body?.data?.token as string;
}

const byKey = (key: string) => DEMO_USERS.find((u) => u.key === key)!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (prefix: string) => `${prefix}-${randomUUID()}`;

async function cash(token: string) {
  const balance = await call("GET", "/wallet/balance", undefined, token);
  return {
    available: balance.body?.data?.available_balance_etb as number,
    escrowed: balance.body?.data?.escrowed_balance_etb as number,
  };
}

async function sharesHeld(token: string, subFundId: string) {
  const holdings = await call("GET", "/portfolio/holdings", undefined, token);
  const holding = (holdings.body?.data ?? []).find(
    (h: any) => h.sub_fund_id === subFundId,
  );
  return {
    owned: holding?.shares_owned ?? 0,
    locked: holding?.locked_shares ?? 0,
  };
}

/** Mints a fresh sub-fund and gives Hanna and Dawit shares to trade with. */
async function setUpMarket(managerToken: string, hannaToken: string, dawitToken: string) {
  const runId = randomUUID().slice(0, 8);

  const asset = await call(
    "POST",
    "/assets",
    {
      asset_name: `Trading Fixture ${runId}`,
      category: "AGRICULTURE",
      physical_location_description: "Jimma Zone coffee estate, Oromia Region",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Highland Valuers PLC",
      surveyor_ecma_license_ref: `ECMA-TRD-${runId}`,
      appraised_value_etb: 5_000_000,
      appraisal_date: "2026-05-20",
      report_document_checksum: createHash("sha256")
        .update(`trade-report-${runId}`)
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
      trust_deed_reference: `TD-TRD-${runId}`,
      registry_office: "Oromia Regional Land Registry",
      vault_receipt_reference: `VLT-TRD-${runId}`,
    },
    managerToken,
  );

  const mint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    {
      total_issued_shares: 5000,
      nominal_price_per_share_etb: 100,
      public_offering_percentage: 100,
    },
    managerToken,
  );

  const subFundId = mint.body?.data?.sub_fund_id;

  // Both traders take a primary position so each side of the book has inventory.
  await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 500, idempotency_key: key("SUB") },
    hannaToken,
  );
  await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 500, idempotency_key: key("SUB") },
    dawitToken,
  );

  return subFundId as string;
}

async function main() {
  const managerToken = await login(byKey("manager").email);
  const hannaToken = await login(byKey("investorA").email);
  const dawitToken = await login(byKey("investorB").email);

  const subFundId = await setUpMarket(managerToken, hannaToken, dawitToken);
  console.log(`\nsub-fund under test: ${subFundId}`);

  console.log("\n[escrow on order placement]");
  const cashBefore = await cash(hannaToken);
  const buy = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 100,
      target_price_per_share_etb: 120,
      idempotency_key: key("ORD"),
    },
    hannaToken,
  );
  check("buy order accepted", buy.status === 201, buy.body);
  check(
    "unmatched buy rests on the book",
    buy.body?.data?.status === "PENDING",
    buy.body?.data,
  );

  const cashAfter = await cash(hannaToken);
  check(
    "buy escrows 100 x 120 = 12,000 ETB",
    near(cashAfter.escrowed - cashBefore.escrowed, 12_000),
    { before: cashBefore, after: cashAfter },
  );
  check(
    "escrowed cash leaves the available balance",
    near(cashBefore.available - cashAfter.available, 12_000),
    { before: cashBefore, after: cashAfter },
  );

  console.log("\n[share locking on sell]");
  const dawitSharesBefore = await sharesHeld(dawitToken, subFundId);
  const sell = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "SELL",
      order_type: "LIMIT",
      total_shares_ordered: 40,
      target_price_per_share_etb: 110,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check("sell order accepted", sell.status === 201, sell.body);

  console.log("\n[matching]");
  check(
    "the crossing sell fills immediately",
    sell.body?.data?.status === "FILLED",
    sell.body?.data,
  );
  check(
    "one fill is produced",
    sell.body?.data?.fills?.length === 1,
    sell.body?.data?.fills,
  );
  check(
    "the resting buy order sets the price at 120",
    sell.body?.data?.fills?.[0]?.price_per_share_etb === 120,
    sell.body?.data?.fills,
  );

  console.log("\n[settlement]");
  const hannaShares = await sharesHeld(hannaToken, subFundId);
  const dawitShares = await sharesHeld(dawitToken, subFundId);
  check(
    "the buyer receives 40 shares",
    hannaShares.owned - 500 === 40,
    hannaShares,
  );
  check(
    "the seller's shares are debited",
    dawitSharesBefore.owned - dawitShares.owned === 40,
    { before: dawitSharesBefore, after: dawitShares },
  );
  check(
    "no shares are left locked on the seller",
    dawitShares.locked === 0,
    dawitShares,
  );

  const hannaCash = await cash(hannaToken);
  check(
    "the buyer's escrow drops by the settled 4,800 ETB",
    near(cashAfter.escrowed - hannaCash.escrowed, 4_800),
    { before: cashAfter, after: hannaCash },
  );

  console.log("\n[partial fill and cancellation]");
  const remaining = await call(
    "GET",
    `/orders/${buy.body?.data?.order_id}`,
    undefined,
    hannaToken,
  );
  check(
    "the buy order is partially filled",
    remaining.body?.data?.status === "PARTIALLY_FILLED" &&
      remaining.body?.data?.remaining_shares === 60,
    remaining.body?.data,
  );

  const beforeCancel = await cash(hannaToken);
  const cancel = await call(
    "POST",
    `/orders/${buy.body?.data?.order_id}/cancel`,
    undefined,
    hannaToken,
  );
  check("order cancelled", cancel.status === 200, cancel.body);

  const afterCancel = await cash(hannaToken);
  check(
    "cancelling returns the unfilled 60 x 120 = 7,200 ETB",
    near(afterCancel.available - beforeCancel.available, 7_200),
    { before: beforeCancel, after: afterCancel },
  );
  // A delta, not an absolute zero: the demo account may carry escrow from
  // orders resting on other books, and cancelling must not touch those.
  check(
    "cancelling releases exactly that order's escrow and nothing else",
    near(beforeCancel.escrowed - afterCancel.escrowed, 7_200),
    { before: beforeCancel, after: afterCancel },
  );

  console.log("\n[guards]");
  const overSell = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "SELL",
      order_type: "LIMIT",
      total_shares_ordered: 999_999,
      target_price_per_share_etb: 100,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check(
    "cannot sell more shares than held",
    overSell.body?.code === "INSUFFICIENT_SHARES",
    overSell.body,
  );

  const overBuy = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 1_000_000,
      target_price_per_share_etb: 5_000,
      idempotency_key: key("ORD"),
    },
    hannaToken,
  );
  check(
    "cannot buy beyond the cash balance",
    overBuy.body?.code === "INSUFFICIENT_FUNDS",
    overBuy.body,
  );

  console.log("\n[order book]");
  await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 10,
      target_price_per_share_etb: 90,
      idempotency_key: key("ORD"),
    },
    hannaToken,
  );
  await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "SELL",
      order_type: "LIMIT",
      total_shares_ordered: 10,
      target_price_per_share_etb: 130,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );

  const book = await call(
    "GET",
    `/market/assets/${subFundId}/order-book`,
    undefined,
    hannaToken,
  );
  check("best bid is 90", book.body?.data?.best_bid_etb === 90, book.body?.data);
  check("best ask is 130", book.body?.data?.best_ask_etb === 130, book.body?.data);
  check("spread is 40", book.body?.data?.spread_etb === 40, book.body?.data);

  console.log("\n[AMM liquidity buyback]");
  const marketBefore = await call(
    "GET",
    `/market/assets/${subFundId}`,
    undefined,
    hannaToken,
  );
  const mark = marketBefore.body?.data?.price_per_share_etb;
  check("the last trade sets the mark to 120", mark === 120, { mark });

  const dawitCashBefore = await cash(dawitToken);
  const marketSell = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: subFundId,
      direction: "SELL",
      order_type: "MARKET",
      total_shares_ordered: 25,
      // Priced far above any bid so nothing on the book can match it.
      target_price_per_share_etb: 900,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check(
    "the unmatched market sell is flagged AMM-eligible",
    Boolean(marketSell.body?.data?.amm_eligible_at),
    marketSell.body?.data,
  );

  console.log("  waiting for the no-match window and the AMM sweep…");
  let ammFilled = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(5000);
    const status = await call(
      "GET",
      `/orders/${marketSell.body?.data?.order_id}`,
      undefined,
      dawitToken,
    );
    if (status.body?.data?.status === "FILLED") {
      ammFilled = true;
      const fill = status.body.data.fills.find(
        (f: any) => f.execution_type === "AMM_BUYBACK",
      );
      check("the AMM absorbed the order", Boolean(fill), status.body.data.fills);
      check(
        "the buyback price applies a 12 percent haircut to the 120 mark",
        fill && near(fill.price_per_share_etb, 105.6),
        fill,
      );
      break;
    }
  }
  check("the AMM sweep filled the stale market order", ammFilled);

  const dawitCashAfter = await cash(dawitToken);
  check(
    "the seller is paid 25 x 105.60 = 2,640 ETB",
    near(dawitCashAfter.available - dawitCashBefore.available, 2_640),
    { before: dawitCashBefore, after: dawitCashAfter },
  );

  console.log("\n[portfolio]");
  const summary = await call("GET", "/portfolio/summary", undefined, hannaToken);
  check("portfolio summary responds", summary.status === 200, summary.body);
  check(
    "the summary values the securities position",
    summary.body?.data?.securities_value_etb > 0,
    summary.body?.data,
  );

  const activity = await call("GET", "/portfolio/activity", undefined, hannaToken);
  check(
    "the activity feed includes trades",
    (activity.body?.data ?? []).some((a: any) => a.stream === "TRADE"),
    activity.body?.data?.slice(0, 3),
  );

  console.log(
    failures === 0
      ? "\nAll Flow 3 checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
