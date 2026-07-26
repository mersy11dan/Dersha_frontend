/**
 * Reads back the demo dataset through the same endpoints the frontend calls and
 * asserts the books balance, so a bad seed is caught before anyone opens the UI.
 *
 *   npm run seed:reset && npm run demo && npm run verify
 */
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
const byKey = (k: string) => DEMO_USERS.find((u) => u.key === k)!;

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok    ${label}`);
    return;
  }
  failures++;
  console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
}

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
    throw new Error(
      `${method} ${path} failed (${response.status}): ${payload.message ?? "unknown error"}`,
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

async function main() {
  const manager = await login(byKey("manager").email);
  const hanna = await login(byKey("investorA").email);
  const dawit = await login(byKey("investorB").email);

  console.log("\nmarket");
  const subFunds = await call("GET", "/market/assets", undefined, hanna);
  check("every catalogue asset is tradable", subFunds.length >= 5, subFunds.length);
  check(
    "each sub-fund carries a category the UI can label",
    subFunds.every((f: any) =>
      [
        "REAL_ESTATE",
        "AGRICULTURE",
        "LOGISTICS_VEHICLE",
        "MICRO_BUSINESS",
        "INFRASTRUCTURE",
        "COMMODITY_GOLD",
        "FINE_ART",
      ].includes(f.category),
    ),
    subFunds.map((f: any) => f.category),
  );
  const tradedFunds = subFunds.filter((f: any) => Number(f.volume_24h_etb) > 0);
  check("at least three sub-funds have printed a trade", tradedFunds.length >= 3, {
    traded: tradedFunds.length,
  });
  check(
    "trading moved the mark away from the nominal price",
    tradedFunds.some(
      (f: any) =>
        Number(f.price_per_share_etb) !== Number(f.nominal_price_per_share_etb),
    ),
    tradedFunds.map((f: any) => [f.price_per_share_etb, f.nominal_price_per_share_etb]),
  );

  const traded = tradedFunds[0] ?? subFunds[0];
  const book = await call(
    "GET",
    `/market/assets/${traded.sub_fund_id}/order-book`,
    undefined,
    hanna,
  );
  check(
    "the order book has visible depth",
    book.bids.length + book.asks.length > 0,
    { bids: book.bids.length, asks: book.asks.length },
  );

  console.log("\nportfolios");
  for (const [label, token] of [
    ["hanna", hanna],
    ["dawit", dawit],
  ] as const) {
    const summary = await call("GET", "/portfolio/summary", undefined, token);
    const holdings = await call("GET", "/portfolio/holdings", undefined, token);
    check(`${label} holds positions`, holdings.length > 0, holdings.length);
    check(
      `${label}'s summary total equals cash plus securities plus baskets`,
      Math.abs(
        Number(summary.total_portfolio_value_etb) -
          (Number(summary.cash_available_etb) +
            Number(summary.cash_escrowed_etb) +
            Number(summary.securities_value_etb) +
            Number(summary.basket_value_etb)),
      ) < 0.05,
      summary,
    );
  }

  console.log("\nbaskets");
  const listings = await call("GET", "/baskets/market", undefined, dawit);
  check("a basket is offered on the market", listings.length > 0);
  const mine = await call("GET", "/baskets", undefined, hanna);
  check("the creator still holds the unsold units", mine.length > 0);
  const royalties = await call("GET", "/baskets/royalties", undefined, hanna);
  check(
    "the creator earned royalties on the units that sold",
    royalties.some((r: any) => Number(r.royalty_earned_etb) > 0),
    royalties,
  );

  console.log("\nincome");
  const income = await call("GET", "/yield/income", undefined, hanna);
  check("the distribution reached the investor", income.payouts.length > 0);
  check(
    "tax was withheld at the statutory rate",
    income.payouts.every(
      (p: any) =>
        Math.abs(
          Number(p.tax_withheld_etb) -
            Number(p.gross_payout_etb) * income.withholding_tax_rate,
        ) < 0.05,
    ),
    income.payouts[0],
  );
  check(
    "net equals gross less tax",
    Math.abs(
      income.lifetime_net_etb -
        (income.lifetime_gross_etb - income.lifetime_tax_withheld_etb),
    ) < 0.05,
    income,
  );

  console.log("\nreconciliation");
  const report = await call("POST", "/admin/reconciliation/run", {}, manager);
  check("the books balance", report.status === "BALANCED", report);
  const halt = await call("GET", "/admin/trading-status", undefined, manager);
  check("trading is open", halt.halted === false, halt);

  console.log(
    failures === 0
      ? "\nDemo dataset verified end to end."
      : `\n${failures} check(s) failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\n[verify] failed:", error.message);
  process.exit(1);
});
