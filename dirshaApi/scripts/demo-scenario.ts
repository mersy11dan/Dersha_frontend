/**
 * Builds a browsable demo platform by driving the public API exactly as the
 * frontend does: assets are appraised, taken into custody and tokenized, the
 * demo investors subscribe and trade, a basket is minted and part-sold, and one
 * sub-fund pays a distribution.
 *
 * Run against a clean database:
 *   npm run seed:reset && npm run demo
 *
 * Requires the API to be running.
 */
import { createHash, randomUUID } from "node:crypto";
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";

const key = (prefix: string) => `IDEM-${prefix}-${randomUUID()}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const byKey = (k: string) => DEMO_USERS.find((u) => u.key === k)!;

async function call(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    const detail = payload.errors ? ` ${JSON.stringify(payload.errors)}` : "";
    throw new Error(
      `${method} ${path} failed (${response.status}): ${payload.message ?? "unknown error"}${detail}`,
    );
  }
  return payload.data;
}

async function login(email: string) {
  const data = await call("POST", "/auth/login", {
    email_address: email,
    password_plain: DEMO_PASSWORD,
  });
  return data.token as string;
}

async function balance(token: string) {
  const wallet = await call("GET", "/wallet/balance", undefined, token);
  return wallet.available_balance_etb as number;
}

/** The gateway caps a single deposit, so larger top-ups arrive in tranches. */
const MAX_DEPOSIT_ETB = 1_000_000;

/** Deposits and waits for the simulated switch to settle it. */
async function topUp(token: string, amountEtb: number) {
  let outstanding = amountEtb;

  while (outstanding > 0) {
    const tranche = Math.min(outstanding, MAX_DEPOSIT_ETB);
    const before = await balance(token);

    await call(
      "POST",
      "/wallet/deposit",
      {
        amount_etb: tranche,
        payment_channel: "TELEBIRR",
        idempotency_key: key("DEPOSIT"),
      },
      token,
    );

    let settled = false;
    for (let attempt = 0; attempt < 30 && !settled; attempt++) {
      await sleep(500);
      settled = (await balance(token)) >= before + tranche;
    }
    if (!settled) throw new Error("Deposit did not settle in time.");

    outstanding -= tranche;
  }
}

interface AssetSpec {
  name: string;
  category: string;
  location: string;
  appraisedEtb: number;
  shares: number;
  nominalEtb: number;
  offeringPercentage: number;
  custodian: string;
}

async function listAsset(managerToken: string, spec: AssetSpec) {
  const runId = randomUUID().slice(0, 8);

  const asset = await call(
    "POST",
    "/assets",
    {
      asset_name: spec.name,
      category: spec.category,
      physical_location_description: spec.location,
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Highland Valuers PLC",
      surveyor_ecma_license_ref: `ECMA-DEMO-${runId}`,
      appraised_value_etb: spec.appraisedEtb,
      appraisal_date: "2026-06-01",
      report_document_checksum: createHash("sha256")
        .update(`demo-${spec.name}-${runId}`)
        .digest("hex"),
    },
    managerToken,
  );

  await call(
    "POST",
    `/assets/${asset.asset_id}/custody`,
    {
      custodian_bank_name: spec.custodian,
      trust_deed_reference: `TD-DEMO-${runId}`,
      registry_office: "Addis Ababa City Land Registry",
      vault_receipt_reference: `VLT-DEMO-${runId}`,
    },
    managerToken,
  );

  const subFund = await call(
    "POST",
    `/assets/${asset.asset_id}/tokenize`,
    {
      total_issued_shares: spec.shares,
      nominal_price_per_share_etb: spec.nominalEtb,
      public_offering_percentage: spec.offeringPercentage,
    },
    managerToken,
  );

  console.log(
    `  listed ${spec.name}: ${spec.shares} shares at ${spec.nominalEtb} ETB`,
  );
  return subFund.sub_fund_id as string;
}

const CATALOGUE: AssetSpec[] = [
  {
    name: "Bole Skyrise Residences Phase II",
    category: "REAL_ESTATE",
    location: "Bole Sub-City, Addis Ababa",
    appraisedEtb: 4_500_000,
    shares: 9_000,
    nominalEtb: 500,
    offeringPercentage: 60,
    custodian: "Dashen Bank Custody",
  },
  {
    name: "Sidama Coffee Washing Station",
    category: "AGRICULTURE",
    location: "Sidama Zone, Hawassa",
    appraisedEtb: 1_800_000,
    shares: 6_000,
    nominalEtb: 300,
    offeringPercentage: 100,
    custodian: "Awash Bank Custody",
  },
  {
    name: "Modjo Dry Port Haulage Fleet",
    category: "LOGISTICS_VEHICLE",
    location: "Modjo Dry Port, Oromia",
    appraisedEtb: 2_400_000,
    shares: 8_000,
    nominalEtb: 300,
    offeringPercentage: 100,
    custodian: "Commercial Bank of Ethiopia Custody",
  },
  {
    name: "Merkato Textile Micro-Enterprise Pool",
    category: "MICRO_BUSINESS",
    location: "Merkato trading district, Addis Ababa",
    appraisedEtb: 3_200_000,
    shares: 8_000,
    nominalEtb: 400,
    offeringPercentage: 100,
    custodian: "Dashen Bank Custody",
  },
  {
    name: "Adama Wind Corridor Substation",
    category: "INFRASTRUCTURE",
    location: "Adama, Oromia",
    appraisedEtb: 5_000_000,
    shares: 10_000,
    nominalEtb: 500,
    offeringPercentage: 100,
    custodian: "Commercial Bank of Ethiopia Custody",
  },
];

async function main() {
  const manager = await login(byKey("manager").email);
  const hanna = await login(byKey("investorA").email);
  const dawit = await login(byKey("investorB").email);
  const bekele = await login(byKey("owner").email);

  console.log("\n[1/6] funding the demo investors");
  await topUp(hanna, 1_500_000);
  await topUp(dawit, 1_200_000);
  await topUp(bekele, 250_000);
  // The manager's account stands in for the operating company that collects
  // rent and declares distributions.
  await topUp(manager, 800_000);

  console.log("\n[2/6] appraising, custodying and tokenizing assets");
  const subFunds: string[] = [];
  for (const spec of CATALOGUE) {
    subFunds.push(await listAsset(manager, spec));
  }
  const [bole, coffee, fleet, textiles, wind] = subFunds;

  console.log("\n[3/6] primary subscriptions");
  const subscriptions: Array<[string, string, number]> = [
    [hanna, bole, 400],
    [hanna, coffee, 500],
    [hanna, fleet, 300],
    [hanna, wind, 200],
    [dawit, bole, 250],
    [dawit, coffee, 400],
    [dawit, textiles, 350],
    [bekele, coffee, 200],
  ];
  for (const [token, subFundId, shares] of subscriptions) {
    await call(
      "POST",
      `/assets/sub-funds/${subFundId}/subscribe`,
      { shares, idempotency_key: key("SUB") },
      token,
    );
  }
  console.log(`  ${subscriptions.length} subscriptions settled`);

  console.log("\n[4/6] secondary market: crossing trades and a resting book");
  // Each pair crosses, which prints a price and moves the mark off nominal.
  const crossings: Array<[string, string, string, number, number]> = [
    [hanna, dawit, coffee, 120, 315],
    [dawit, hanna, bole, 80, 520],
    [hanna, dawit, fleet, 60, 288],
  ];
  for (const [seller, buyer, subFundId, shares, price] of crossings) {
    await call(
      "POST",
      "/orders",
      {
        sub_fund_id: subFundId,
        direction: "SELL",
        order_type: "LIMIT",
        total_shares_ordered: shares,
        target_price_per_share_etb: price,
        idempotency_key: key("ORDER"),
      },
      seller,
    );
    await call(
      "POST",
      "/orders",
      {
        sub_fund_id: subFundId,
        direction: "BUY",
        order_type: "LIMIT",
        total_shares_ordered: shares,
        target_price_per_share_etb: price,
        idempotency_key: key("ORDER"),
      },
      buyer,
    );
  }

  // Unmatched orders either side of the mark, so the book has visible depth.
  const resting: Array<[string, string, "BUY" | "SELL", number, number]> = [
    [dawit, coffee, "BUY", 100, 305],
    [dawit, coffee, "BUY", 250, 298],
    [hanna, coffee, "SELL", 80, 328],
    [hanna, bole, "SELL", 60, 545],
    [dawit, bole, "BUY", 120, 505],
    [dawit, textiles, "SELL", 100, 415],
  ];
  for (const [token, subFundId, direction, shares, price] of resting) {
    await call(
      "POST",
      "/orders",
      {
        sub_fund_id: subFundId,
        direction,
        order_type: "LIMIT",
        total_shares_ordered: shares,
        target_price_per_share_etb: price,
        idempotency_key: key("ORDER"),
      },
      token,
    );
  }
  console.log(
    `  ${crossings.length} trades printed, ${resting.length} orders resting`,
  );

  console.log("\n[5/6] minting a basket and offering units");
  const basket = await call(
    "POST",
    "/baskets",
    {
      basket_name: "Highland Diversified Growth",
      total_basket_shares: 500,
      constituents: [
        { sub_fund_id: coffee, shares_allocated: 200 },
        { sub_fund_id: bole, shares_allocated: 100 },
        { sub_fund_id: fleet, shares_allocated: 150 },
      ],
      idempotency_key: key("MINT"),
    },
    hanna,
  );

  const listing = await call(
    "POST",
    `/baskets/${basket.basket_id}/list`,
    {
      sale_mode: "FRACTIONAL_POOL",
      total_basket_shares_listed: 300,
      // A small premium to NAV, which is what the marketplace card highlights.
      price_per_unit_etb: Number((basket.nav_per_basket_share_etb * 1.04).toFixed(2)),
      idempotency_key: key("LIST"),
    },
    hanna,
  );

  await call(
    "POST",
    `/baskets/listings/${listing.listing_id}/buy`,
    { basket_shares: 120, idempotency_key: key("BUY") },
    dawit,
  );
  console.log(
    `  basket NAV ${basket.nav_total_etb} ETB, 120 of 300 offered units sold`,
  );

  console.log("\n[6/6] declaring a rent distribution");
  const distribution = await call(
    "POST",
    `/yield/sub-funds/${bole}/distributions`,
    {
      yield_category: "REAL_ESTATE_RENT",
      gross_revenue_collected_etb: 420_000,
      opex_deductions_etb: 60_000,
      platform_fees_retained_etb: 18_000,
      reporting_period_start: "2026-04-01",
      reporting_period_end: "2026-06-30",
      idempotency_key: key("YIELD"),
    },
    manager,
  );
  console.log(
    `  paid ${distribution.net_amount_disbursed_etb} ETB net to ${distribution.recipient_count} holders,` +
      ` ${distribution.total_tax_withheld_etb} ETB withheld`,
  );

  console.log("\nDemo platform ready. Sign in at http://localhost:5173 with:");
  console.table(
    DEMO_USERS.map((user) => ({
      email: user.email,
      role: user.role,
      password: DEMO_PASSWORD,
    })),
  );
}

main().catch((error) => {
  console.error("\n[demo] failed:", error.message);
  process.exit(1);
});
