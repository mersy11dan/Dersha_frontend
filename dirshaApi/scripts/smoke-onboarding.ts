/**
 * End-to-end smoke test for Flow 1: register -> verify -> deposit -> withdraw.
 * Requires the API to be running (npm run dev).
 *
 * Run with: npx tsx scripts/smoke-onboarding.ts
 */
import { randomUUID } from "node:crypto";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";

let token = "";
let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}`, detail ?? "");
  }
}

async function call(
  method: string,
  path: string,
  body?: unknown,
  useAuth = true,
) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json as any };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const stamp = Date.now().toString().slice(-8);
  const email = `smoke${stamp}@dersha.test`;
  // Nine digits after +251; kept unique per run so registration never collides.
  const phone = `+2519${stamp.slice(0, 8)}`;
  const password = "SmokeTest#2026";

  console.log(`\nAPI: ${BASE}`);

  console.log("\n[health]");
  const health = await call("GET", "/health", undefined, false);
  check("health responds 200", health.status === 200, health.body);

  console.log("\n[register]");
  const register = await call(
    "POST",
    "/auth/register",
    {
      full_name_raw: "Smoke Test Investor",
      email_address: email,
      phone_number_eth: phone,
      password_plain: password,
      is_diaspora_account: false,
    },
    false,
  );
  check("register returns 201", register.status === 201, register.body);
  check(
    "account starts as PENDING_KYC",
    register.body?.data?.user?.account_status === "PENDING_KYC",
    register.body?.data?.user?.account_status,
  );
  check("register issues a token", Boolean(register.body?.data?.token));
  token = register.body?.data?.token ?? "";
  const userId = register.body?.data?.user?.user_id;

  console.log("\n[duplicate registration]");
  const dupe = await call(
    "POST",
    "/auth/register",
    {
      full_name_raw: "Smoke Test Investor",
      email_address: email,
      phone_number_eth: phone,
      password_plain: password,
      is_diaspora_account: false,
    },
    false,
  );
  check("duplicate email is rejected with 409", dupe.status === 409, dupe.body);

  console.log("\n[validation]");
  const badPhone = await call(
    "POST",
    "/auth/register",
    {
      full_name_raw: "Bad Phone",
      email_address: `bad${stamp}@dersha.test`,
      phone_number_eth: "0911223344",
      password_plain: password,
    },
    false,
  );
  check("malformed phone rejected with 400", badPhone.status === 400, badPhone.body);

  console.log("\n[wallet gating before KYC]");
  const gated = await call("GET", "/wallet/balance");
  check(
    "unverified account cannot reach wallet (403 KYC_REQUIRED)",
    gated.status === 403 && gated.body?.code === "KYC_REQUIRED",
    gated.body,
  );

  console.log("\n[kyc]");
  const selfie = "data:image/jpeg;base64," + "A".repeat(256);

  const underage = await call("POST", "/kyc/verify-fayda", {
    fayda_id_number: "1234-5678-9011",
    live_selfie_base64: selfie,
    liveness_passed: true,
  });
  check(
    "under-18 applicant rejected",
    underage.status === 422 && underage.body?.code === "UNDERAGE_APPLICANT",
    underage.body,
  );

  const lowMatch = await call("POST", "/kyc/verify-fayda", {
    fayda_id_number: "1234-5678-9010",
    live_selfie_base64: selfie,
    liveness_passed: true,
  });
  check(
    "low biometric confidence rejected",
    lowMatch.status === 422 && lowMatch.body?.code === "BIOMETRIC_MATCH_FAILED",
    lowMatch.body,
  );

  const kyc = await call("POST", "/kyc/verify-fayda", {
    fayda_id_number: `1234-5678-${stamp.slice(0, 3)}5`,
    live_selfie_base64: selfie,
    liveness_passed: true,
  });
  check("kyc succeeds", kyc.status === 200, kyc.body);
  check(
    "account flips to ACTIVE_VERIFIED",
    kyc.body?.data?.user?.account_status === "ACTIVE_VERIFIED",
    kyc.body?.data?.user?.account_status,
  );
  check("kyc reissues a token", Boolean(kyc.body?.data?.token));
  check(
    "fayda id is stored masked",
    typeof kyc.body?.data?.user?.fayda_id_number_masked === "string" &&
      kyc.body.data.user.fayda_id_number_masked.startsWith("FYD-****-"),
    kyc.body?.data?.user?.fayda_id_number_masked,
  );
  token = kyc.body?.data?.token ?? token;

  console.log("\n[wallet balance]");
  const balance = await call("GET", "/wallet/balance");
  check("balance reachable after KYC", balance.status === 200, balance.body);
  check(
    "new wallet starts at zero",
    balance.body?.data?.available_balance_etb === 0,
    balance.body?.data,
  );

  console.log("\n[deposit]");
  const depositKey = `IDEM-DEPOSIT-${randomUUID()}`;
  const deposit = await call("POST", "/wallet/deposit", {
    amount_etb: 25000,
    payment_channel: "TELEBIRR",
    idempotency_key: depositKey,
  });
  check("deposit accepted with 202", deposit.status === 202, deposit.body);
  check(
    "deposit starts PROCESSING",
    deposit.body?.data?.status === "PROCESSING",
    deposit.body?.data,
  );

  const replay = await call("POST", "/wallet/deposit", {
    amount_etb: 25000,
    payment_channel: "TELEBIRR",
    idempotency_key: depositKey,
  });
  check(
    "replayed idempotency key returns the same transaction",
    replay.body?.data?.transaction_id === deposit.body?.data?.transaction_id,
    { first: deposit.body?.data?.transaction_id, replay: replay.body?.data?.transaction_id },
  );

  const tooSmall = await call("POST", "/wallet/deposit", {
    amount_etb: 5,
    payment_channel: "TELEBIRR",
    idempotency_key: `IDEM-DEPOSIT-${randomUUID()}`,
  });
  check("below-minimum deposit rejected", tooSmall.status === 400, tooSmall.body);

  console.log("\n[settlement]");
  let settled = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    await sleep(500);
    const txn = await call(
      "GET",
      `/wallet/transactions/${deposit.body?.data?.transaction_id}`,
    );
    if (txn.body?.data?.status === "SETTLED") {
      settled = true;
      break;
    }
  }
  check("simulated gateway settles the deposit", settled);

  const funded = await call("GET", "/wallet/balance");
  check(
    "balance credited with 25,000 ETB",
    funded.body?.data?.available_balance_etb === 25000,
    funded.body?.data,
  );

  console.log("\n[withdrawal]");
  const withdraw = await call("POST", "/wallet/withdraw", {
    amount_etb: 10000,
    destination_bank_code: "CBEETET",
    destination_account_number: "1000123456789",
    idempotency_key: `IDEM-WITHDRAW-${randomUUID()}`,
  });
  check("withdrawal accepted with 202", withdraw.status === 202, withdraw.body);

  const afterWithdraw = await call("GET", "/wallet/balance");
  check(
    "available balance drops to 15,000",
    afterWithdraw.body?.data?.available_balance_etb === 15000,
    afterWithdraw.body?.data,
  );
  check(
    "escrow holds the 10,000 in flight",
    afterWithdraw.body?.data?.escrowed_balance_etb === 10000,
    afterWithdraw.body?.data,
  );

  const overdraw = await call("POST", "/wallet/withdraw", {
    amount_etb: 500000,
    destination_bank_code: "CBEETET",
    destination_account_number: "1000123456789",
    idempotency_key: `IDEM-WITHDRAW-${randomUUID()}`,
  });
  check(
    "overdraft blocked with INSUFFICIENT_FUNDS",
    overdraw.body?.code === "INSUFFICIENT_FUNDS",
    overdraw.body,
  );

  console.log("\n[login]");
  const login = await call(
    "POST",
    "/auth/login",
    { email_address: email, password_plain: password },
    false,
  );
  check("login succeeds", login.status === 200, login.body);
  check(
    "verified user is routed to the dashboard",
    login.body?.data?.nextStage === "DASHBOARD",
    login.body?.data?.nextStage,
  );

  const wrongPassword = await call(
    "POST",
    "/auth/login",
    { email_address: email, password_plain: "WrongPassword123" },
    false,
  );
  check(
    "wrong password rejected with 401",
    wrongPassword.status === 401,
    wrongPassword.body,
  );

  console.log("\n[me]");
  const me = await call("GET", "/auth/me");
  check("me returns the profile", me.body?.data?.user?.user_id === userId, me.body);
  check(
    "password hash never leaves the API",
    !JSON.stringify(me.body).includes("password"),
    me.body,
  );

  console.log(
    failures === 0
      ? "\nAll onboarding smoke checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("smoke run crashed:", error);
  process.exit(1);
});
