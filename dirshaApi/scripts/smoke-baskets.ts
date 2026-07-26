/**
 * Flow 4 smoke test: basket minting, custody of constituents, NAV recalculation
 * pushed over the WebSocket feed, fractional purchases and the creator royalty.
 *
 * Requires the API to be running and `npm run seed` to have been executed.
 */
import { createHash, randomUUID } from "node:crypto";
import WebSocket from "ws";
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
const WS_URL = process.env.SMOKE_WS_URL ?? "ws://localhost:5000/ws";
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

async function sharesHeld(token: string, subFundId: string) {
  const holdings = await call("GET", "/portfolio/holdings", undefined, token);
  const holding = (holdings.body?.data ?? []).find(
    (h: any) => h.sub_fund_id === subFundId,
  );
  return holding?.shares_owned ?? 0;
}

/** Mints a tradable sub-fund and sells `shares` of it to each subscriber. */
async function createSubFund(
  managerToken: string,
  label: string,
  nominalPrice: number,
  subscribers: Array<{ token: string; shares: number }>,
) {
  const runId = randomUUID().slice(0, 8);

  const asset = await call(
    "POST",
    "/assets",
    {
      asset_name: `${label} ${runId}`,
      category: "REAL_ESTATE",
      physical_location_description: `Bole Sub-City parcel, Addis Ababa (${label})`,
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Highland Valuers PLC",
      surveyor_ecma_license_ref: `ECMA-BSK-${runId}`,
      appraised_value_etb: nominalPrice * 4000,
      appraisal_date: "2026-05-20",
      report_document_checksum: createHash("sha256")
        .update(`basket-report-${runId}`)
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
      trust_deed_reference: `TD-BSK-${runId}`,
      registry_office: "Addis Ababa City Land Registry",
      vault_receipt_reference: `VLT-BSK-${runId}`,
    },
    managerToken,
  );

  const mint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    {
      total_issued_shares: 4000,
      nominal_price_per_share_etb: nominalPrice,
      public_offering_percentage: 100,
    },
    managerToken,
  );
  const subFundId = mint.body?.data?.sub_fund_id as string;

  check(`fixture: ${label} tokenized`, Boolean(subFundId), mint.body);

  for (const subscriber of subscribers) {
    const subscription = await call(
      "POST",
      `/assets/sub-funds/${subFundId}/subscribe`,
      { shares: subscriber.shares, idempotency_key: key("SUB") },
      subscriber.token,
    );
    check(
      `fixture: ${subscriber.shares} shares of ${label} subscribed`,
      subscription.status === 201,
      subscription.body,
    );
  }

  return subFundId;
}

/** Collects NAV frames for one basket off the live feed. */
function watchNav(basketId: string) {
  const received: any[] = [];
  const socket = new WebSocket(WS_URL);

  const ready = new Promise<void>((resolve, reject) => {
    socket.on("open", () => {
      socket.send(
        JSON.stringify({ action: "subscribe", topic: `basket:${basketId}` }),
      );
      resolve();
    });
    socket.on("error", reject);
  });

  socket.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.event === "nav" && message.data?.basket_id === basketId) {
        received.push(message.data);
      }
    } catch {
      /* ignore malformed frames */
    }
  });

  return {
    ready,
    received,
    close: () => socket.close(),
    async waitForFrame(timeoutMs = 45_000) {
      const started = Date.now();
      const startCount = received.length;
      while (Date.now() - started < timeoutMs) {
        if (received.length > startCount) return received[received.length - 1];
        await sleep(500);
      }
      return null;
    },
  };
}

async function main() {
  const managerToken = await login(byKey("manager").email);
  const hannaToken = await login(byKey("investorA").email);
  const dawitToken = await login(byKey("investorB").email);
  const bekeleToken = await login(byKey("owner").email);

  console.log("\n[fixtures] minting two sub-funds for the basket");
  const coffeeId = await createSubFund(managerToken, "Basket Leg A", 100, [
    { token: hannaToken, shares: 300 },
    { token: dawitToken, shares: 200 },
  ]);
  const landId = await createSubFund(managerToken, "Basket Leg B", 250, [
    { token: hannaToken, shares: 200 },
    { token: dawitToken, shares: 100 },
  ]);

  const hannaCoffeeBefore = await sharesHeld(hannaToken, coffeeId);

  console.log("\n[minting]");
  const mint = await call(
    "POST",
    "/baskets",
    {
      basket_name: `Highland Diversified ${randomUUID().slice(0, 6)}`,
      total_basket_shares: 100,
      constituents: [
        { sub_fund_id: coffeeId, shares_allocated: 100 },
        { sub_fund_id: landId, shares_allocated: 40 },
      ],
      idempotency_key: key("MINT"),
    },
    hannaToken,
  );
  check("basket minted", mint.status === 201, mint.body);

  const basketId = mint.body?.data?.basket_id;
  const expectedNav = 100 * 100 + 40 * 250; // 20,000 ETB
  check(
    "NAV totals the constituent marks (20,000 ETB)",
    near(mint.body?.data?.nav_total_etb, expectedNav),
    mint.body?.data,
  );
  check(
    "NAV per basket share is 20,000 / 100 = 200 ETB",
    near(mint.body?.data?.nav_per_basket_share_etb, 200),
    mint.body?.data,
  );
  check(
    "constituent weights sum to 100 percent",
    near(
      (mint.body?.data?.constituents ?? []).reduce(
        (sum: number, c: any) => sum + c.weight_percentage,
        0,
      ),
      100,
      0.05,
    ),
    mint.body?.data?.constituents,
  );
  check(
    "the creator receives the whole supply",
    mint.body?.data?.my_basket_shares === 100,
    mint.body?.data,
  );

  console.log("\n[custody of the underlying]");
  const hannaCoffeeAfter = await sharesHeld(hannaToken, coffeeId);
  check(
    "the wrapped shares leave the creator's holdings",
    hannaCoffeeBefore - hannaCoffeeAfter === 100,
    { before: hannaCoffeeBefore, after: hannaCoffeeAfter },
  );

  const overMint = await call(
    "POST",
    "/baskets",
    {
      basket_name: "Impossible Basket",
      total_basket_shares: 100,
      constituents: [
        { sub_fund_id: coffeeId, shares_allocated: 999_999 },
        { sub_fund_id: landId, shares_allocated: 1 },
      ],
      idempotency_key: key("MINT"),
    },
    hannaToken,
  );
  check(
    "cannot wrap shares you do not hold",
    overMint.body?.code === "INSUFFICIENT_SHARES",
    overMint.body,
  );

  const duplicateLeg = await call(
    "POST",
    "/baskets",
    {
      basket_name: "Duplicate Legs",
      total_basket_shares: 100,
      constituents: [
        { sub_fund_id: coffeeId, shares_allocated: 5 },
        { sub_fund_id: coffeeId, shares_allocated: 5 },
      ],
      idempotency_key: key("MINT"),
    },
    hannaToken,
  );
  check(
    "the same sub-fund cannot appear twice",
    duplicateLeg.body?.code === "DUPLICATE_CONSTITUENT",
    duplicateLeg.body,
  );

  console.log("\n[live NAV over WebSocket]");
  const feed = watchNav(basketId);
  await feed.ready;
  await sleep(500);

  // Trade a constituent above its nominal price; the mark moves, and every
  // basket holding it must reprice.
  await call(
    "POST",
    "/orders",
    {
      sub_fund_id: coffeeId,
      direction: "BUY",
      order_type: "LIMIT",
      total_shares_ordered: 10,
      target_price_per_share_etb: 150,
      idempotency_key: key("ORD"),
    },
    bekeleToken,
  );
  const crossing = await call(
    "POST",
    "/orders",
    {
      sub_fund_id: coffeeId,
      direction: "SELL",
      order_type: "LIMIT",
      total_shares_ordered: 10,
      target_price_per_share_etb: 140,
      idempotency_key: key("ORD"),
    },
    dawitToken,
  );
  check("the constituent traded at 150", crossing.body?.data?.status === "FILLED", {
    status: crossing.body?.data?.status,
  });

  const navFrame = await feed.waitForFrame();
  feed.close();

  check("a NAV frame arrived on the basket topic", Boolean(navFrame), navFrame);
  const repricedNav = 100 * 150 + 40 * 250; // 25,000 ETB
  check(
    "the pushed NAV reflects the new 150 ETB mark (25,000 ETB)",
    navFrame && near(navFrame.nav_total_etb, repricedNav),
    navFrame,
  );
  check(
    "the pushed NAV per share rises to 250 ETB",
    navFrame && near(navFrame.nav_per_basket_share_etb, 250),
    navFrame,
  );

  console.log("\n[listing and fractionalisation]");
  const listing = await call(
    "POST",
    `/baskets/${basketId}/list`,
    {
      sale_mode: "FRACTIONAL_POOL",
      total_basket_shares_listed: 60,
      price_per_unit_etb: 260,
      idempotency_key: key("LIST"),
    },
    hannaToken,
  );
  check("listing created", listing.status === 201, listing.body);

  const listingId = listing.body?.data?.listing_id;
  const afterListing = await call("GET", `/baskets/${basketId}`, undefined, hannaToken);
  check(
    "listed basket shares are locked",
    afterListing.body?.data?.my_locked_basket_shares === 60,
    afterListing.body?.data,
  );

  const selfBuy = await call(
    "POST",
    `/baskets/listings/${listingId}/buy`,
    { basket_shares: 5, idempotency_key: key("BUY") },
    hannaToken,
  );
  check("the seller cannot buy their own listing", selfBuy.body?.code === "SELF_TRADE", selfBuy.body);

  const partial = await call(
    "POST",
    `/baskets/listings/${listingId}/buy`,
    { basket_shares: 25, idempotency_key: key("BUY") },
    dawitToken,
  );
  check("a fractional slice can be bought", partial.status === 200, partial.body);
  check(
    "the buyer pays 25 x 260 = 6,500 ETB",
    near(partial.body?.data?.gross_paid_etb, 6_500),
    partial.body?.data,
  );

  const afterPartial = await call(
    "GET",
    `/baskets/listings/${listingId}`,
    undefined,
    dawitToken,
  );
  check(
    "the listing stays open with 35 shares remaining",
    afterPartial.body?.data?.status === "PARTIALLY_FILLED" &&
      afterPartial.body?.data?.basket_shares_remaining === 35,
    afterPartial.body?.data,
  );

  const overBuy = await call(
    "POST",
    `/baskets/listings/${listingId}/buy`,
    { basket_shares: 999, idempotency_key: key("BUY") },
    dawitToken,
  );
  check(
    "cannot buy more than the listing holds",
    overBuy.body?.code === "INSUFFICIENT_LISTED_SHARES",
    overBuy.body,
  );

  console.log("\n[creator royalty on the secondary trade]");
  // Dawit, who is not the creator, resells part of his slice to Bekele.
  const resale = await call(
    "POST",
    `/baskets/${basketId}/list`,
    {
      sale_mode: "FRACTIONAL_POOL",
      total_basket_shares_listed: 20,
      price_per_unit_etb: 300,
      idempotency_key: key("LIST"),
    },
    dawitToken,
  );
  check("the new holder can relist", resale.status === 201, resale.body);

  const hannaCashBefore = await available(hannaToken);
  const dawitCashBefore = await available(dawitToken);
  const bekeleCashBefore = await available(bekeleToken);

  const royaltyTrade = await call(
    "POST",
    `/baskets/listings/${resale.body?.data?.listing_id}/buy`,
    { basket_shares: 10, idempotency_key: key("BUY") },
    bekeleToken,
  );
  check("resale settled", royaltyTrade.status === 200, royaltyTrade.body);

  const gross = 10 * 300;
  const royalty = gross * 0.005; // 15 ETB
  check(
    "the royalty is 0.5 percent of the 3,000 ETB trade",
    near(royaltyTrade.body?.data?.creator_royalty_etb, royalty),
    royaltyTrade.body?.data,
  );

  const hannaCashAfter = await available(hannaToken);
  const dawitCashAfter = await available(dawitToken);
  const bekeleCashAfter = await available(bekeleToken);

  check(
    "the creator is paid the royalty even though they did not sell",
    near(hannaCashAfter - hannaCashBefore, royalty),
    { before: hannaCashBefore, after: hannaCashAfter },
  );
  check(
    "the seller receives the trade net of the royalty",
    near(dawitCashAfter - dawitCashBefore, gross - royalty),
    { before: dawitCashBefore, after: dawitCashAfter },
  );
  check(
    "the buyer pays exactly the advertised price",
    near(bekeleCashBefore - bekeleCashAfter, gross),
    { before: bekeleCashBefore, after: bekeleCashAfter },
  );

  const earnings = await call("GET", "/baskets/royalties", undefined, hannaToken);
  const report = (earnings.body?.data ?? []).find(
    (row: any) => row.basket_id === basketId,
  );
  // Both secondary trades on this basket accrue to Hanna: 6,500 + 3,000 gross.
  check(
    "the earnings report accrues every trade on the basket",
    report && report.trade_count === 2 && near(report.gross_volume_etb, 9_500),
    report,
  );
  check(
    "reported royalties are 0.5 percent of lifetime volume",
    report && near(report.royalty_earned_etb, 47.5),
    report,
  );

  console.log("\n[whole-basket listings]");
  const wholeSubFundA = await createSubFund(managerToken, "Whole Leg A", 50, [
    { token: dawitToken, shares: 100 },
  ]);
  const wholeSubFundB = await createSubFund(managerToken, "Whole Leg B", 75, [
    { token: dawitToken, shares: 100 },
  ]);
  const wholeBasket = await call(
    "POST",
    "/baskets",
    {
      basket_name: `Indivisible ${randomUUID().slice(0, 6)}`,
      total_basket_shares: 10,
      constituents: [
        { sub_fund_id: wholeSubFundA, shares_allocated: 50 },
        { sub_fund_id: wholeSubFundB, shares_allocated: 50 },
      ],
      idempotency_key: key("MINT"),
    },
    dawitToken,
  );
  const wholeListing = await call(
    "POST",
    `/baskets/${wholeBasket.body?.data?.basket_id}/list`,
    {
      sale_mode: "WHOLE_BASKET_ONLY",
      total_basket_shares_listed: 10,
      price_per_unit_etb: 640,
      idempotency_key: key("LIST"),
    },
    dawitToken,
  );

  const partialAttempt = await call(
    "POST",
    `/baskets/listings/${wholeListing.body?.data?.listing_id}/buy`,
    { basket_shares: 4, idempotency_key: key("BUY") },
    hannaToken,
  );
  check(
    "a whole-basket listing refuses a partial buy",
    partialAttempt.body?.code === "PARTIAL_PURCHASE_NOT_ALLOWED",
    partialAttempt.body,
  );

  const wholeBuy = await call(
    "POST",
    `/baskets/listings/${wholeListing.body?.data?.listing_id}/buy`,
    { basket_shares: 10, idempotency_key: key("BUY") },
    hannaToken,
  );
  check("the whole basket sells in one go", wholeBuy.status === 200, wholeBuy.body);

  console.log("\n[dissolution]");
  const hannaWholeLegBefore = await sharesHeld(hannaToken, wholeSubFundA);
  const dissolve = await call(
    "POST",
    `/baskets/${wholeBasket.body?.data?.basket_id}/dissolve`,
    undefined,
    hannaToken,
  );
  check("the sole holder can dissolve the basket", dissolve.status === 200, dissolve.body);

  const hannaWholeLegAfter = await sharesHeld(hannaToken, wholeSubFundA);
  check(
    "dissolution returns the custodied constituents",
    hannaWholeLegAfter - hannaWholeLegBefore === 50,
    { before: hannaWholeLegBefore, after: hannaWholeLegAfter },
  );

  const partialDissolve = await call(
    "POST",
    `/baskets/${basketId}/dissolve`,
    undefined,
    dawitToken,
  );
  check(
    "a partial holder cannot dissolve",
    partialDissolve.body?.code === "PARTIAL_HOLDER",
    partialDissolve.body,
  );

  console.log("\n[portfolio and market views]");
  const summary = await call("GET", "/portfolio/summary", undefined, dawitToken);
  check(
    "basket positions are valued in the portfolio",
    summary.body?.data?.basket_value_etb > 0,
    summary.body?.data,
  );

  const market = await call("GET", "/baskets/market", undefined, bekeleToken);
  check(
    "open listings appear on the basket market",
    (market.body?.data ?? []).some((row: any) => row.basket_id === basketId),
    market.body?.data?.slice(0, 2),
  );
  check(
    "listings report their premium to NAV",
    (market.body?.data ?? []).every(
      (row: any) => typeof row.premium_to_nav_percentage === "number",
    ),
    market.body?.data?.slice(0, 2),
  );

  console.log(
    failures === 0
      ? "\nAll Flow 4 checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
