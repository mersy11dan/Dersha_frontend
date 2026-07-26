/**
 * Verifies the funding-source linking endpoint added for onboarding Step 3.
 * Requires the API to be running.
 */
import { randomUUID } from "node:crypto";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
let token = "";
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL  ${label}`, detail ?? "");
  }
}

async function call(method: string, path: string, body?: unknown, auth = true) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: (await response.json().catch(() => ({}))) as any };
}

async function main() {
  const stamp = Date.now().toString().slice(-8);
  const email = `funding${stamp}@dersha.test`;

  const register = await call(
    "POST",
    "/auth/register",
    {
      full_name_raw: "Funding Test User",
      email_address: email,
      phone_number_eth: `+2519${stamp.slice(0, 8)}`,
      password_plain: "FundingTest#2026",
    },
    false,
  );
  token = register.body?.data?.token ?? "";
  check("registered", register.status === 201, register.body);

  const beforeKyc = await call("POST", "/funding-sources", {
    source_type: "BANK",
    provider_code: "CBEETET",
    account_number: "1000123456789",
  });
  check(
    "linking blocked before KYC",
    beforeKyc.status === 403,
    beforeKyc.body,
  );

  const kyc = await call("POST", "/kyc/verify-fayda", {
    fayda_id_number: `4321-8765-${stamp.slice(0, 3)}5`,
    live_selfie_base64: "data:image/jpeg;base64," + "B".repeat(256),
    liveness_passed: true,
  });
  token = kyc.body?.data?.token ?? token;
  check("kyc verified", kyc.status === 200, kyc.body);

  const link = await call("POST", "/funding-sources", {
    source_type: "BANK",
    provider_code: "CBEETET",
    account_number: "1000123456789",
  });
  check("funding source linked", link.status === 201, link.body);
  check(
    "account number is masked in the response",
    typeof link.body?.data?.account_number_masked === "string" &&
      link.body.data.account_number_masked.endsWith("6789") &&
      !link.body.data.account_number_masked.includes("1000123"),
    link.body?.data,
  );

  const duplicate = await call("POST", "/funding-sources", {
    source_type: "BANK",
    provider_code: "CBEETET",
    account_number: "1000123456789",
  });
  check("duplicate link rejected with 409", duplicate.status === 409, duplicate.body);

  const badProvider = await call("POST", "/funding-sources", {
    source_type: "BANK",
    provider_code: "NOT_A_BANK",
    account_number: "1000123456780",
  });
  check("unknown provider rejected", badProvider.status === 400, badProvider.body);

  const list = await call("GET", "/funding-sources");
  check("list returns one source", list.body?.data?.length === 1, list.body);
  check("linked source is primary", list.body?.data?.[0]?.is_primary === true, list.body?.data);

  console.log(
    failures === 0
      ? "\nAll funding-source checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
